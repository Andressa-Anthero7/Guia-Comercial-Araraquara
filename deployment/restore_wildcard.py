"""Restore the existing GCA wildcard certificate. Run explicitly as root.

This restores HTTPS; persistent Cloudez configuration remains a separate action.
No private key contents are printed or copied.
"""
import argparse
import datetime
import hashlib
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

CONFIG = Path('/srv/guia_comercial_araraquara.2d4f02a0.configr.cloud/etc/nginx/domain_ssl.conf')
CERT_DIR = Path('/etc/letsencrypt/live/guiacomararaquara-wildcard')


def run(*args):
    return subprocess.run(args, check=True, capture_output=True).stdout


def replacement(source):
    updated = source
    for directive, filename in [('ssl_certificate', 'fullchain.pem'), ('ssl_certificate_key', 'privkey.pem')]:
        pattern = rf'(?m)^[ \t]*{directive}[ \t]+[^;\r\n]+;[ \t]*(?:#[^\r\n]*)?$'
        value = f'{directive} {(CERT_DIR / filename).as_posix()};'
        updated, count = re.subn(pattern, lambda match: value, updated)
        if count != 1:
            raise RuntimeError(f'Esperada exatamente uma diretiva {directive}; encontradas {count}. Nenhuma alteracao aplicada.')
    return updated


def atomic_write(path, content, metadata):
    descriptor, filename = tempfile.mkstemp(prefix='.gca-ssl-', dir=path.parent)
    temporary = Path(filename)
    try:
        with os.fdopen(descriptor, 'wb') as destination:
            destination.write(content)
            destination.flush()
            os.fsync(destination.fileno())
        os.chown(temporary, metadata.st_uid, metadata.st_gid)
        os.chmod(temporary, metadata.st_mode & 0o7777)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true', help='Apply after all checks; otherwise inspect only.')
    args = parser.parse_args()
    if os.geteuid() != 0:
        raise RuntimeError('Execute no terminal root da Cloudez. Nenhuma alteracao aplicada.')
    certificate = CERT_DIR / 'fullchain.pem'
    private_key = CERT_DIR / 'privkey.pem'
    if not certificate.is_file() or not private_key.is_file():
        raise RuntimeError('Wildcard anterior nao encontrado. Sera necessario conferir o inventario do Certbot antes de emitir novamente.')
    run('openssl', 'x509', '-in', str(certificate), '-noout', '-checkend', '604800')
    for host in ['guiacomararaquara.com.br', 'm-espetinhos.guiacomararaquara.com.br']:
        match = run('openssl', 'x509', '-in', str(certificate), '-noout', '-checkhost', host).decode()
        if 'does match certificate' not in match:
            raise RuntimeError(f'Certificado nao cobre {host}. Nenhuma alteracao aplicada.')
    details = run('openssl', 'x509', '-in', str(certificate), '-noout', '-ext', 'subjectAltName', '-serial', '-enddate').decode()
    if not re.search(r'DNS:\*\.guiacomararaquara\.com\.br(?=[,\s]|$)', details):
        raise RuntimeError('Certificado nao contem o wildcard esperado. Nenhuma alteracao aplicada.')
    cert_public = run('openssl', 'x509', '-in', str(certificate), '-pubkey', '-noout')
    key_public = run('openssl', 'pkey', '-in', str(private_key), '-passin', 'pass:', '-pubout')
    if hashlib.sha256(cert_public).digest() != hashlib.sha256(key_public).digest():
        raise RuntimeError('Certificado e chave nao correspondem. Nenhuma alteracao aplicada.')
    target = CONFIG.resolve(strict=True)
    if target != CONFIG:
        raise RuntimeError('Configuracao virou link simbolico; revisar destino antes de alterar.')
    metadata = target.stat()
    original = target.read_bytes()
    updated = replacement(original.decode()).encode()
    run('nginx', '-t')
    print(details.strip(), flush=True)
    if not args.apply:
        print('Conferencias passaram. Para restaurar, execute este script com --apply.')
        return
    if target.read_bytes() != original:
        raise RuntimeError('Configuracao mudou durante a conferencia. Execute novamente.')
    backup = Path(tempfile.mkdtemp(prefix='gca-wildcard-', dir='/root'))
    shutil.copy2(target, backup / 'domain_ssl.conf')
    (backup / 'record.txt').write_text('UTC: ' + datetime.datetime.now(datetime.timezone.utc).isoformat() + '\nRestauracao do wildcard existente; sem nova emissao.\n')
    print(f'Backup: {backup}', flush=True)
    atomic_write(target, updated, metadata)
    try:
        run('nginx', '-t')
        run('nginx', '-s', 'reload')
    except Exception:
        atomic_write(target, original, metadata)
        print('Configuracao anterior restaurada.', flush=True)
        run('nginx', '-t')
        run('nginx', '-s', 'reload')
        raise
    print('Wildcard reaplicado e recarga solicitada. Conferir HTTPS externo. A persistencia no painel Cloudez ainda precisa ser resolvida.')


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, OSError, subprocess.CalledProcessError) as error:
        if isinstance(error, subprocess.CalledProcessError):
            print('ERRO: verificacao ou comando falhou:', ' '.join(error.cmd))
            print(error.stderr.decode(errors='replace'))
        else:
            print('ERRO:', error)
        raise SystemExit(1)
