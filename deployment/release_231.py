"""Checked release runner: isolated migration rehearsal, backups, install, verify.

Execute using deployment/remote.py --action prepare|install|verify.
Never prints environment values or changes protected server configuration.
"""
import hashlib
import json
import os
from pathlib import Path
import shlex
import shutil
import signal
import sqlite3
import subprocess
import sys
import time
import zipfile

VERSION = '2.3.1'
EXPECTED_DIGEST = 'c0b374eddfc0862a0583a4a5a6e21097245234942cd3b3d9a92afbc59448ce63'
HOME = Path.home()
assert HOME.name in ('gca-backend', 'guia_comercial_araraquara')
API = HOME.name == 'gca-backend'
ROOT = Path('/srv/' + HOME.name + '.2d4f02a0.configr.cloud/www')
STAGE = HOME / 'releases' / (VERSION + '-' + EXPECTED_DIGEST[:8])
PACKAGE = STAGE / 'package'
PYTHON = '/srv/gca-backend.2d4f02a0.configr.cloud/.virtualenv/3.12/bin/python'
os.umask(0o077)

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def save(name, value):
    (STAGE/name).write_text(json.dumps(value, indent=2))

def environment():
    for line in (ROOT.parent/'.env').read_text().splitlines():
        key, sep, value = line.strip().removeprefix('export ').partition('=')
        if sep and key and not key.startswith('#'):
            parsed = shlex.split(value, comments=True)
            if parsed:
                os.environ[key.strip()] = parsed[0]
    for line in (ROOT.parent/'etc/uwsgi/uwsgi.ini').read_text().splitlines():
        key, sep, value = line.strip().partition('=')
        if sep and key.strip() == 'env':
            name, _, content = value.strip().partition('=')
            os.environ[name] = content.strip()
    os.environ['DJANGO_DEBUG'] = 'false'

def protected():
    paths = list((ROOT/'project').glob('*.py')) + [ROOT/'manage.py', ROOT.parent/'.env', ROOT.parent/'etc/uwsgi/uwsgi.ini']
    return {str(p): digest(p) for p in paths if p.is_file()}

def snapshot(path, prior=None):
    with sqlite3.connect(path.as_uri()+'?mode=ro', uri=True) as db:
        assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
        tables = sorted(prior) if prior else [r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'core_%' ORDER BY name")]
        result = {}
        for table in tables:
            assert table.replace('_','').isalnum()
            columns = prior[table]['columns'] if prior else [r[1] for r in db.execute(f'PRAGMA table_info("{table}")')]
            fields = ','.join('"'+c+'"' for c in columns)
            values = list(db.execute(f'SELECT {fields} FROM "{table}" ORDER BY id'))
            result[table] = {'columns': columns, 'count': len(values), 'sha256': hashlib.sha256(json.dumps(values, separators=(',',':')).encode()).hexdigest()}
        return result

def master():
    family = {}
    for line in subprocess.check_output(['ps','-u',str(os.getuid()),'-o','pid=,ppid=,comm='],text=True).splitlines():
        pid, parent, name = line.split()
        if name == 'uwsgi':
            family[int(pid)] = int(parent)
    masters = [pid for pid,parent in family.items() if parent not in family]
    assert len(masters) == 1, 'Cannot uniquely identify API master'
    return masters[0]

def prepare():
    archive = HOME / f'gca-backoffice-{VERSION}-r2.zip'
    assert digest(archive) == EXPECTED_DIGEST, 'Archive checksum mismatch'
    assert not (STAGE/'installation.json').exists(), 'Already installed; verify instead'
    STAGE.mkdir(parents=True, exist_ok=True)
    PACKAGE.mkdir(exist_ok=True)
    with zipfile.ZipFile(archive) as z:
        for item in z.infolist():
            target = (PACKAGE/item.filename).resolve()
            assert PACKAGE.resolve() in target.parents, 'Unsafe archive path'
            if item.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(z.read(item))
    manifest = json.loads((PACKAGE/'manifest.json').read_text())
    assert manifest['version'] == VERSION
    for name, checksum in manifest['files'].items():
        assert digest(PACKAGE/name) == checksum, name
    result = {'archive_sha256': EXPECTED_DIGEST, 'account': HOME.name}
    if API:
        environment()
        for old in (ROOT/'core/migrations').glob('*.py'):
            new = PACKAGE/'api/core/migrations'/old.name
            assert new.is_file() and old.read_bytes().replace(b'\r\n',b'\n') == new.read_bytes().replace(b'\r\n',b'\n'), 'Migration history changed'
        backup_dir = HOME/'deploy-backups'/f'release-{VERSION}'
        backup_dir.mkdir(parents=True, exist_ok=True)
        backup = backup_dir/f'before-{time.time_ns()}.sqlite3'
        with sqlite3.connect((ROOT/'db.sqlite3').as_uri()+'?mode=ro',uri=True) as source, sqlite3.connect(backup) as target:
            source.backup(target)
        before = snapshot(backup)
        candidate = STAGE/'candidate'
        candidate.mkdir(exist_ok=True)
        shutil.copytree(ROOT/'project', candidate/'project', dirs_exist_ok=True)
        shutil.copy2(ROOT/'manage.py', candidate/'manage.py')
        shutil.copytree(PACKAGE/'api/core', candidate/'core', dirs_exist_ok=True)
        shutil.copy2(backup, candidate/'db.sqlite3')
        env = dict(os.environ, DATABASE_URL='', WEBPUSH_VAPID_PRIVATE_KEY='')
        code = '''import os,json
os.environ['DJANGO_SETTINGS_MODULE']='project.settings'
from django.conf import settings
from pathlib import Path
assert Path(settings.DATABASES['default']['NAME']).resolve()==Path('db.sqlite3').resolve()
import django
django.setup()
from django.core.management import call_command
call_command('check')
call_command('migrate',interactive=False,verbosity=0)
from core.models import Business
from core.publication import public_businesses
from core.serializers import BusinessSerializer
before=list(Business.objects.filter(status='active').order_by('pk').values_list('pk',flat=True))
after=list(public_businesses().order_by('pk').values_list('pk',flat=True))
assert before==after, 'Public business visibility changes; review before release'
data=BusinessSerializer(public_businesses(),many=True).data
assert len(data)==len(after)
print(json.dumps({'public_business_ids':after,'serialized_businesses':len(data),'debug':settings.DEBUG}))
'''
        completed = subprocess.run([PYTHON,'-c',code],cwd=candidate,env=env,text=True,capture_output=True)
        if completed.returncode:
            # Django error traces can contain settings; expose only final exception.
            print(completed.stderr.strip().splitlines()[-1] if completed.stderr else 'Candidate validation failed')
            raise RuntimeError('Candidate failed; production untouched')
        candidate_result = json.loads(completed.stdout.strip().splitlines()[-1])
        assert snapshot(candidate/'db.sqlite3',before) == before, 'Migration changed existing data'
        result.update(database_backup=str(backup), core_tables=before, protected_files=protected(), candidate=candidate_result, master=master())
    save('prepared.json',result)
    print(json.dumps({k:v for k,v in result.items() if k not in ('core_tables','protected_files')}))

def install():
    assert not (STAGE/'installation.json').exists(), 'Already installed; verify instead'
    before=json.loads((STAGE/'prepared.json').read_text())
    if API:
        environment()
        assert protected()==before['protected_files'], 'Configuration changed since rehearsal'
        assert snapshot(ROOT/'db.sqlite3',before['core_tables']) == before['core_tables'], 'Data changed since rehearsal; prepare a fresh backup'
        pid=master()
    command=[sys.executable,str(PACKAGE/'install.py'),'--target','api' if API else 'public','--root',str(ROOT)]
    if API:
        command += ['--python',PYTHON]
    result=subprocess.run(command,capture_output=True,text=True)
    print(result.stdout)
    save('installation-attempt.json', {'returncode': result.returncode, 'stdout': result.stdout, 'stderr': result.stderr})
    if result.returncode:
        print(result.stderr.strip().splitlines()[-1] if result.stderr else 'No stderr from installer')
        raise RuntimeError('Installer failed; inspect backup before retrying')
    record={'version':VERSION,'installed_at':time.time(),'archive_sha256':EXPECTED_DIGEST}
    if API:
        assert protected()==before['protected_files']
        assert snapshot(ROOT/'db.sqlite3',before['core_tables'])==before['core_tables']
        assert pid==master()
        os.kill(pid,signal.SIGHUP)
        record['api_master_reloaded']=pid
    save('installation.json',record)
    print(json.dumps(record))

def verify():
    manifest=json.loads((PACKAGE/'manifest.json').read_text())
    prefix='api/' if API else 'public/'
    names=[name for name in manifest['files'] if name.startswith(prefix)]
    for name in names:
        assert digest(ROOT/name[len(prefix):])==manifest['files'][name], name
    result={'version':VERSION,'verified_files':len(names),'account':HOME.name}
    if API:
        before=json.loads((STAGE/'prepared.json').read_text())
        assert protected()==before['protected_files']
        assert snapshot(ROOT/'db.sqlite3',before['core_tables'])==before['core_tables']
        result.update(core_tables_preserved=len(before['core_tables']),configuration_preserved=True,database_integrity='ok')
    save('verification.json',result)
    print(json.dumps(result))

{'prepare':prepare,'install':install,'verify':verify}[sys.argv[1]]()
