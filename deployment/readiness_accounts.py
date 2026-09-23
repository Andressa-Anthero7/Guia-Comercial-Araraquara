"""Temporary production audit accounts; emits credentials only on create.

Capture create output in a private local file, never in public evidence.
Cleanup only removes IDs recorded by this script, with ownership assertions.
"""
import json
import os
from pathlib import Path
import secrets
import shlex
import sys

ROOT = Path('/srv/gca-backend.2d4f02a0.configr.cloud/www')
STATE = Path.home() / 'deploy-backups/readiness-20260923-accounts.json'
os.umask(0o077)
os.chdir(ROOT)
sys.path.insert(0, str(ROOT))
for line in (ROOT.parent / '.env').read_text().splitlines():
    key, sep, value = line.strip().removeprefix('export ').partition('=')
    if sep and key and not key.startswith('#'):
        parts = shlex.split(value, comments=True)
        if parts:
            os.environ[key.strip()] = parts[0]
os.environ['DJANGO_SETTINGS_MODULE'] = 'project.settings'
import django
django.setup()
from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.db import transaction
from core.models import Advertiser, Business

User = get_user_model()
action = sys.argv[1]
if action == 'create':
    assert not STATE.exists(), 'Audit state already exists; clean up before creating again'
    prefix = 'audit-' + secrets.token_hex(5)
    with transaction.atomic():
        password = secrets.token_urlsafe(32)
        admin = User.objects.create_user(username=prefix+'-admin', password=password, is_staff=True)
        advertiser = User.objects.create_user(username=prefix+'-advertiser', password=password)
        business = Business.objects.create(name=prefix, status='inactive', plan_type='paid', street='Teste automatizado', number='0')
        profile = Advertiser.objects.create(name=prefix, user=advertiser, status='active')
        profile.businesses.add(business)
        state = dict(prefix=prefix, admin_id=admin.pk, advertiser_id=advertiser.pk, business_id=business.pk, profile_id=profile.pk,
                     admin=admin.username, advertiser=advertiser.username, password=password, slug=business.slug)
        STATE.write_text(json.dumps(state))
    print(json.dumps(state))
elif action == 'cleanup':
    state = json.loads(STATE.read_text())
    with transaction.atomic():
        ids = [state['admin_id'], state['advertiser_id']]
        users = User.objects.filter(pk__in=ids)
        assert users.count() == 2 and all(u.username.startswith(state['prefix']+'-') for u in users)
        business = Business.objects.get(pk=state['business_id'], name=state['prefix'])
        assert business.status == 'inactive'
        profile = Advertiser.objects.get(pk=state['profile_id'], user_id=state['advertiser_id'])
        assert list(profile.businesses.values_list('pk', flat=True)) == [business.pk]
        removed_sessions = 0
        for session in Session.objects.iterator():
            if session.get_decoded().get('_auth_user_id') in [str(i) for i in ids]:
                session.delete()
                removed_sessions += 1
        profile.delete()
        business.delete()
        users.delete()
    STATE.unlink()
    print(json.dumps({'cleanup': 'passed', 'test_users_removed': 2, 'test_business_removed': True, 'sessions_removed': removed_sessions}))
else:
    raise RuntimeError('Unsupported action')
