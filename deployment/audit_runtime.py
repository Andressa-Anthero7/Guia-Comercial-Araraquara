"""Read-only operational inventory. Never prints credentials or private keys."""
import json
import os
import sys
import shlex
from pathlib import Path

ROOT = Path('/srv/gca-backend.2d4f02a0.configr.cloud/www')
os.chdir(ROOT)
sys.path.insert(0, str(ROOT))
for line in (ROOT.parent/'.env').read_text().splitlines():
    key, sep, value = line.strip().removeprefix('export ').partition('=')
    if sep and key and not key.startswith('#'):
        parsed = shlex.split(value, comments=True)
        if parsed:
            os.environ[key.strip()] = parsed[0]
for line in (ROOT.parent/'etc/uwsgi/uwsgi.ini').read_text().splitlines():
    name, sep, value = line.strip().partition('=')
    if sep and name.strip() == 'env':
        key, sep, content = value.strip().partition('=')
        if sep:
            os.environ[key] = content.strip()
# Read the actual application's environment; an SSH login does not inherit it.
process_environment_loaded = False
for proc in Path('/proc').iterdir():
    if not proc.name.isdigit():
        continue
    try:
        if proc.stat().st_uid != os.getuid():
            continue
        cmd = (proc/'cmdline').read_bytes()
        if (proc/'comm').read_text().strip() != 'uwsgi':
            continue
        for entry in (proc/'environ').read_bytes().split(b'\0'):
            key, sep, value = entry.partition(b'=')
            if sep:
                os.environ[key.decode()] = value.decode()
        process_environment_loaded = True
        break
    except (OSError, UnicodeError):
        continue
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
import django
django.setup()
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Count
from core.models import Advertiser, AdvertisingSubscription, Business, PushSubscription

duplicates = []
for group in Advertiser.objects.values('name').annotate(count=Count('pk')).filter(count__gt=1):
    duplicates.append({'name': group['name'], 'profiles': list(Advertiser.objects.filter(name=group['name']).annotate(
        businesses_count=Count('businesses', distinct=True), subscriptions_count=Count('subscriptions', distinct=True)).values(
        'id', 'user_id', 'status', 'businesses_count', 'subscriptions_count'))})
result = {
    'process_environment_loaded': process_environment_loaded,
    'database_engine': settings.DATABASES['default']['ENGINE'],
    'database_size_bytes': (ROOT/'db.sqlite3').stat().st_size,
    'debug': settings.DEBUG,
    'secure_cookies': settings.SESSION_COOKIE_SECURE,
    'email_backend': settings.EMAIL_BACKEND,
    'email_host_configured': bool(settings.EMAIL_HOST and settings.EMAIL_HOST!='localhost'),
    'email_credentials_configured': bool(settings.EMAIL_HOST_USER and settings.EMAIL_HOST_PASSWORD),
    'vapid_configured': all(bool(os.environ.get(k)) for k in ['WEBPUSH_VAPID_PUBLIC_KEY','WEBPUSH_VAPID_PRIVATE_KEY']),
    'active_push_subscriptions': PushSubscription.objects.filter(is_active=True).count(),
    'active_staff': list(get_user_model().objects.filter(is_staff=True,is_active=True).values('id','username','is_superuser')),
    'businesses': Business.objects.count(),
    'subscriptions': AdvertisingSubscription.objects.count(),
    'duplicate_names': duplicates,
    'configured_integration_env_names': sorted(k for k in os.environ if any(token in k.upper() for token in ['SMTP','EMAIL','AWS','S3','CLOUDFLARE','ASAAS','MERCADO','STRIPE','ACME','DNS_'])),
    'backup_directories': sorted(p.name for p in (Path.home()/'deploy-backups').glob('*') if p.is_dir()),
}
print(json.dumps(result, ensure_ascii=False, indent=2))
