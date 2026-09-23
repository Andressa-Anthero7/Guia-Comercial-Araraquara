"""Install the approved daily invoice job without changing application settings.

Run through remote.py as the API account. Logs and rollback copies stay private.
This generates internal invoices only; it does not charge a payment provider.
"""
import json
import os
from pathlib import Path
import subprocess
import time

HOME = Path.home()
assert HOME.name == 'gca-backend'
ROOT = Path('/srv/gca-backend.2d4f02a0.configr.cloud/www')
PYTHON = '/srv/gca-backend.2d4f02a0.configr.cloud/.virtualenv/3.12/bin/python'
os.umask(0o077)
OPS = HOME / 'operations'
OPS.mkdir(exist_ok=True)
runner = OPS / 'billing.py'
content = '''import fcntl, json, os, shlex, sys
from pathlib import Path
from datetime import datetime, timezone
root = Path('/srv/gca-backend.2d4f02a0.configr.cloud/www')
lock = open(Path.home() / 'operations/billing.lock', 'a')
try:
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
except BlockingIOError:
    raise SystemExit(0)
for line in (root.parent / '.env').read_text().splitlines():
    name, sep, value = line.strip().removeprefix('export ').partition('=')
    if sep and name and not name.startswith('#'):
        parsed = shlex.split(value, comments=True)
        if parsed:
            os.environ[name.strip()] = parsed[0]
for line in (root.parent / 'etc/uwsgi/uwsgi.ini').read_text().splitlines():
    key, sep, value = line.strip().partition('=')
    if sep and key.strip() == 'env':
        name, _, value = value.strip().partition('=')
        os.environ[name] = value.strip()
os.environ['DJANGO_DEBUG'] = 'false'
os.environ['DJANGO_SETTINGS_MODULE'] = 'project.settings'
os.chdir(root)
sys.path.insert(0, str(root))
import django
django.setup()
from core.billing import renew_subscriptions
print(json.dumps({'at': datetime.now(timezone.utc).isoformat(), 'result': renew_subscriptions()}))
'''
prior = subprocess.run(['crontab', '-l'], capture_output=True, text=True)
assert prior.returncode == 0 or 'no crontab' in prior.stderr.lower(), prior.stderr
old = prior.stdout
marker = '# gca-daily-invoice-renewal'
entry = f'15 6 * * * {PYTHON} {runner} >> {OPS}/billing.log 2>&1 {marker}'
stamp = str(time.time_ns())
backup = OPS / ('crontab-before-billing-' + stamp + '.txt')
backup.write_text(old)
previous_runner = runner.read_bytes() if runner.exists() else None
if previous_runner is not None:
    (OPS / ('billing-before-' + stamp + '.py')).write_bytes(previous_runner)
runner.write_text(content)
runner.chmod(0o600)
try:
    result = subprocess.run([PYTHON, str(runner)], capture_output=True, text=True, check=True)
    outcome = json.loads(result.stdout)
    updated = '\n'.join(line for line in old.splitlines() if marker not in line).rstrip() + '\n' + entry + '\n'
    subprocess.run(['crontab', '-'], input=updated, text=True, check=True)
    assert entry in subprocess.check_output(['crontab', '-l'], text=True)
except Exception:
    subprocess.run(['crontab', '-'], input=old, text=True, check=True)
    if previous_runner is not None:
        runner.write_bytes(previous_runner)
    raise
print(json.dumps({'schedule': '06:15 daily in server timezone', 'crontab_backup': str(backup), 'first_run': outcome, 'verified': True}))
