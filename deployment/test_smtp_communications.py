"""Exercise actual email events in a disposable database, never customer data.

Default: local in-memory email backend. --send: real configured SMTP, with all
envelopes restricted to the owner's explicitly authorized test address.
"""
import argparse
from collections import Counter
from datetime import timedelta
from decimal import Decimal
import json
import os
from pathlib import Path
import secrets
import sys
import tempfile
from unittest.mock import patch

RECIPIENT = 'alytha.corretora.graos@gmail.com'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--send', action='store_true')
    args = parser.parse_args()
    remote_root = Path('/srv/gca-backend.2d4f02a0.configr.cloud/www')
    root = remote_root if remote_root.exists() else Path(__file__).resolve().parents[1] / 'backend'
    sys.path.insert(0, str(root))
    os.environ['DJANGO_SETTINGS_MODULE'] = 'project.settings'
    from django.conf import settings
    with tempfile.TemporaryDirectory(prefix='gca-smtp-test-') as temporary:
        # Set the isolated database before loading Django models or signals.
        settings.DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': str(Path(temporary) / 'test.sqlite3')}}
        settings.GCA_EMAIL_EVENTS_ENABLED = True
        settings.GCA_EMAIL_DELIVERY_ENABLED = True
        if not args.send:
            settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
        else:
            assert settings.EMAIL_BACKEND == 'django.core.mail.backends.smtp.EmailBackend'
        import django
        django.setup()
        from django.core.management import call_command
        from django.db import connections
        from django.contrib.auth import get_user_model
        from django.contrib.auth.tokens import default_token_generator
        from django.utils import timezone
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode
        from rest_framework.test import APIRequestFactory
        from core import email_service, account_recovery
        from core.email_queue import process_outbox
        from core.email_reminders import queue_reminders
        from core.models import Advertiser, Business, AdvertisingPlan, AdvertisingSubscription, Invoice, TransactionalEmail
        connection = email_service.email_connection()
        if connection is None:
            raise RuntimeError('SMTP is not configured; run deployment/configure_smtp.py first')
        if args.send:
            connection.open()  # TLS and authentication before generating any events.
        call_command('migrate', interactive=False, verbosity=0)
        sent = []
        run_id = secrets.token_hex(12)
        original_deliver = email_service.deliver

        def test_delivery(recipient, title, paragraphs, **kwargs):
            # Redirect both old/new account-email notices to the same approved inbox.
            kwargs['connection'] = connection
            kwargs['message_id'] = f'<gca-test-{run_id}-{len(sent) + 1}@guiacomararaquara.com.br>'
            paragraphs = ['TESTE DO SISTEMA: dados fictícios em banco temporário. Não há cobrança nem alteração de cliente.', *paragraphs]
            if '?uid=' in kwargs.get('url', ''):
                paragraphs.append('Este link pertence a uma conta temporária e não funciona no portal público; o token é validado automaticamente no teste.')
            original_deliver(RECIPIENT, '[TESTE GCA] ' + title, paragraphs, **kwargs)
            sent.append(title)

        def flush(expected):
            result = process_outbox()
            assert result == {'sent': expected, 'failed': 0}, result

        try:
            with patch('core.email_queue.deliver', test_delivery), patch('core.account_recovery.deliver', test_delivery):
                user = get_user_model().objects.create_user('smtp-test-' + secrets.token_hex(4), email=RECIPIENT, password=secrets.token_urlsafe(24))
                advertiser = Advertiser.objects.create(user=user, name='CLIENTE FICTÍCIO — TESTE SMTP', email=RECIPIENT, billing_email=RECIPIENT)
                flush(1)
                advertiser.save()
                flush(0)  # Welcome is not duplicated on an unrelated save.

                factory = APIRequestFactory()
                response = account_recovery.request_password_reset(factory.post('/test-reset', {'email': RECIPIENT}, format='json'))
                assert response.status_code == 200
                token = default_token_generator.make_token(user)
                payload = {'uid': urlsafe_base64_encode(force_bytes(user.pk)), 'token': token, 'password': secrets.token_urlsafe(24)}
                assert account_recovery.confirm_password_reset(factory.post('/test-confirm', payload, format='json')).status_code == 200
                assert account_recovery.confirm_password_reset(factory.post('/test-confirm', payload, format='json')).status_code == 400
                flush(1)

                user.refresh_from_db()
                user.email = 'new-address@example.invalid'
                user.save(update_fields=['email'])
                flush(2)

                business = Business.objects.create(name='ESTABELECIMENTO FICTÍCIO — TESTE SMTP', street='Rua de teste', number='0', email=RECIPIENT, status='pending')
                flush(1)
                for status in ['active', 'suspended', 'inactive']:
                    business.status = status
                    business.save(update_fields=['status'])
                    flush(1)

                today = timezone.localdate()
                plan = AdvertisingPlan.objects.create(name='PLANO FICTÍCIO', price=Decimal('10'))
                subscription = AdvertisingSubscription.objects.create(advertiser=advertiser, business=business, plan=plan, start_date=today, next_due_date=today, agreed_price=Decimal('10'))
                invoice = Invoice.objects.create(subscription=subscription, reference_month=today.replace(day=1), due_date=today, amount=Decimal('10'))
                flush(1)
                for status in ['overdue', 'paid', 'cancelled']:
                    invoice.status = status
                    invoice.save(update_fields=['status'])
                    flush(1)
                # Prepare reminder states without generating duplicate invoice notices.
                for offset in [3, 0, -3]:
                    Invoice.objects.filter(pk=invoice.pk).update(status='open', due_date=today + timedelta(days=offset))
                    queue_reminders(today)
                    flush(1)
                    queue_reminders(today)
                    flush(0)
                assert len(sent) == 16, len(sent)
                kinds = dict(Counter(TransactionalEmail.objects.values_list('kind', flat=True)))
                assert not TransactionalEmail.objects.exclude(status='sent').exists()
                print(json.dumps({'mode': 'smtp' if args.send else 'local', 'accepted_messages': len(sent), 'queued_event_types': kinds, 'password_recovery': 'sent; token accepted once', 'welcome_deduplicated': True, 'reminders_deduplicated': True, 'production_database_touched': False, 'inbox_delivery': 'requires recipient confirmation' if args.send else 'not sent externally'}, ensure_ascii=True))
        finally:
            connection.close()
            connections.close_all()


if __name__ == '__main__':
    main()
