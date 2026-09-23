"""Add disabled-by-default email settings without replacing hosting settings."""
import ast
import json
import os
from pathlib import Path
import shutil
import time

root = Path('/srv/gca-backend.2d4f02a0.configr.cloud/www')
target = root / 'project/settings.py'
source = target.read_text()
assigned = {t.id for n in ast.parse(source).body if isinstance(n, ast.Assign) for t in n.targets if isinstance(t, ast.Name)}
definitions = {
    'EMAIL_BACKEND': "os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')",
    'EMAIL_HOST': "os.environ.get('EMAIL_HOST', '')",
    'EMAIL_HOST_USER': "os.environ.get('EMAIL_HOST_USER', '')",
    'EMAIL_HOST_PASSWORD': "os.environ.get('EMAIL_HOST_PASSWORD', '')",
    'DEFAULT_FROM_EMAIL': "os.environ.get('DEFAULT_FROM_EMAIL', 'Guia Comercial Araraquara <nao-responda@guiacomararaquara.com.br>')",
    'GCA_EMAIL_EVENTS_ENABLED': "os.environ.get('GCA_EMAIL_EVENTS_ENABLED', 'false').lower() == 'true'",
    'GCA_EMAIL_DELIVERY_ENABLED': "os.environ.get('GCA_EMAIL_DELIVERY_ENABLED', 'false').lower() == 'true'",
    'PASSWORD_RESET_TIMEOUT': '3600',
}
missing = {key: value for key, value in definitions.items() if key not in assigned}
if missing:
    os.umask(0o077)
    backup = Path.home() / 'deploy-backups' / ('email-settings-' + str(time.time_ns()))
    backup.mkdir(parents=True)
    shutil.copy2(target, backup / 'settings.py')
    updated = source + '\n# Transactional email: disabled until SMTP validation.\n' + ''.join(f'{key} = {value}\n' for key, value in missing.items())
    compile(updated, str(target), 'exec')
    staged = target.with_suffix('.py.email-new')
    staged.write_text(updated)
    shutil.copymode(target, staged)
    staged.replace(target)
    print(json.dumps({'added_settings': list(missing), 'backup': str(backup)}))
else:
    print(json.dumps({'added_settings': []}))
