"""Run interactively to configure Cloudez SMTP without exposing the password.

Password is read without echo and transported only through encrypted SSH stdin.
Authentication is checked before changing production. No message is sent.
"""
import getpass
import json
from pathlib import Path
import shlex
import subprocess

REMOTE = r"""
import json, os, shutil, signal, smtplib, ssl, subprocess, sys, time
from pathlib import Path
os.umask(0o077)
assert Path.home().name == 'gca-backend'
config = json.load(sys.stdin)
assert config['EMAIL_HOST'] == 'ip-45-79-2-160.cloudezapp.io'
assert config['EMAIL_HOST_USER'] == 'nao-responda@guiacomararaquara.com.br'
try:
    with smtplib.SMTP(config['EMAIL_HOST'], 587, timeout=20) as smtp:
        smtp.ehlo()
        smtp.starttls(context=ssl.create_default_context())
        smtp.ehlo()
        smtp.login(config['EMAIL_HOST_USER'], config['EMAIL_HOST_PASSWORD'])
except Exception as error:
    print(json.dumps({'configured': False, 'stage': 'smtp_authentication', 'error': type(error).__name__}))
    raise SystemExit(1)
root = Path('/srv/gca-backend.2d4f02a0.configr.cloud/www')
settings = root / 'project/settings.py'
secret = Path.home() / '.config/gca/smtp.json'
marker = '# GCA private SMTP configuration'
source = settings.read_text()
block = '''
# GCA private SMTP configuration
import json as _gca_smtp_json
with open('/home/gca-backend/.config/gca/smtp.json', encoding='utf-8') as _gca_smtp_file:
    _gca_smtp_config = _gca_smtp_json.load(_gca_smtp_file)
for _gca_smtp_key in ('EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_HOST_USER', 'EMAIL_HOST_PASSWORD', 'EMAIL_USE_TLS', 'EMAIL_USE_SSL', 'DEFAULT_FROM_EMAIL'):
    globals()[_gca_smtp_key] = _gca_smtp_config[_gca_smtp_key]
del _gca_smtp_config, _gca_smtp_file, _gca_smtp_key, _gca_smtp_json
# End GCA private SMTP configuration
'''
if marker in source:
    assert block.strip() in source, 'Existing SMTP block differs; review before changing'
updated = source if marker in source else source + '\n' + block
compile(updated, str(settings), 'exec')
processes = {}
for line in subprocess.check_output(['ps', '-u', str(os.getuid()), '-o', 'pid=,ppid=,comm='], text=True).splitlines():
    pid, parent, name = line.split()
    if name == 'uwsgi': processes[int(pid)] = int(parent)
masters = [pid for pid, parent in processes.items() if parent not in processes]
assert len(masters) == 1, 'Cannot identify API process'
backup = Path.home() / 'deploy-backups' / ('smtp-config-' + str(time.time_ns()))
backup.mkdir(parents=True, mode=0o700)
shutil.copy2(settings, backup / 'settings.py')
previous = secret.read_bytes() if secret.exists() else None
if previous is not None: (backup / 'smtp.json').write_bytes(previous)
secret.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
try:
    staged_secret = secret.with_suffix('.new')
    staged_secret.write_text(json.dumps(config), encoding='utf-8')
    staged_secret.chmod(0o600)
    staged_secret.replace(secret)
    staged = settings.with_suffix('.py.smtp-new')
    staged.write_text(updated)
    shutil.copymode(settings, staged)
    staged.replace(settings)
    result = subprocess.run([sys.executable, 'manage.py', 'check'], cwd=root, capture_output=True)
    assert result.returncode == 0, 'Application check failed'
    os.kill(masters[0], signal.SIGHUP)
except Exception:
    staged = settings.with_suffix('.py.smtp-rollback')
    staged.write_bytes((backup / 'settings.py').read_bytes())
    shutil.copymode(backup / 'settings.py', staged)
    staged.replace(settings)
    if previous is not None: secret.write_bytes(previous)
    else: secret.unlink(missing_ok=True)
    print(json.dumps({'configured': False, 'stage': 'installation', 'restored': True}))
    raise SystemExit(1)
print(json.dumps({'configured': True, 'smtp_authenticated': True, 'tls_verified': True, 'port': 587, 'backup': str(backup), 'messages_sent': 0}))
"""


def main():
    password = getpass.getpass('Senha de nao-responda@guiacomararaquara.com.br (oculta): ')
    if not password:
        raise SystemExit('Senha vazia; nenhuma alteracao realizada.')
    config = {
        'EMAIL_HOST': 'ip-45-79-2-160.cloudezapp.io', 'EMAIL_PORT': 587,
        'EMAIL_HOST_USER': 'nao-responda@guiacomararaquara.com.br',
        'EMAIL_HOST_PASSWORD': password, 'EMAIL_USE_TLS': True, 'EMAIL_USE_SSL': False,
        'DEFAULT_FROM_EMAIL': 'Guia Comercial Araraquara <nao-responda@guiacomararaquara.com.br>',
    }
    command = ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15',
               '-i', str(Path.home() / '.ssh/cloudez_gca_backend'),
               'gca-backend@ip-45-79-2-160.cloudezapp.io',
               '/srv/gca-backend.2d4f02a0.configr.cloud/.virtualenv/3.12/bin/python -c ' + shlex.quote(REMOTE)]
    result = subprocess.run(command, input=json.dumps(config).encode(), capture_output=True)
    # Never display remote tracebacks or echo the supplied configuration.
    if result.stdout:
        print(result.stdout.decode('utf-8', errors='replace').strip())
    if result.returncode and not result.stdout:
        print('Falha na conexao/configuracao SSH. A senha nao foi exibida.')
    raise SystemExit(result.returncode)


if __name__ == '__main__':
    main()
