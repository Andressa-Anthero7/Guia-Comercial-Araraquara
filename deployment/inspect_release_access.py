"""Print only operational capabilities and non-secret production settings."""
import ast
import json
import os
import subprocess
from pathlib import Path

home = Path.home()
api = home.name == 'gca-backend'
base = Path('/srv/gca-backend.2d4f02a0.configr.cloud' if api else '/srv/guia_comercial_araraquara.2d4f02a0.configr.cloud')
result = {'account': home.name, 'uid': os.getuid()}
paths = ['www/project/settings.py', 'www/project/wsgi.py', '.env', 'etc/uwsgi/uwsgi.ini', 'etc/nginx/domain_ssl.conf']
result['paths'] = {name: {'exists': (base/name).exists(), 'readable': os.access(base/name, os.R_OK), 'writable': os.access(base/name, os.W_OK)} for name in paths}
if api:
    source = (base/'www/project/settings.py').read_text()
    result['settings'] = [ast.unparse(n) for n in ast.parse(source).body if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id in ['DEBUG', 'SESSION_COOKIE_SECURE', 'CSRF_COOKIE_SECURE'] for t in n.targets)]
    result['wsgi_loads_env'] = 'dotenv' in (base/'www/project/wsgi.py').read_text()
    result['processes'] = subprocess.check_output(['ps','-u',str(os.getuid()),'-o','pid=,ppid=,comm='],text=True).splitlines()
sudo = subprocess.run(['sudo','-n','-l'],capture_output=True,text=True)
result['sudo_capabilities'] = sudo.stdout.strip() if sudo.returncode == 0 else 'unavailable'
print(json.dumps(result,indent=2))
