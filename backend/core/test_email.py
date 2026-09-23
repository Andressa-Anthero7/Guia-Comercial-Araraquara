from datetime import timedelta
from decimal import Decimal
from smtplib import SMTPException
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.db import transaction
from django.test import TestCase, override_settings
from django.utils import timezone

from .email_queue import enqueue, process_outbox
from .email_reminders import queue_reminders
from .email_service import deliver
from .models import Advertiser, AdvertisingPlan, AdvertisingSubscription, Business, Invoice, TransactionalEmail


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    GCA_EMAIL_EVENTS_ENABLED=True, GCA_EMAIL_DELIVERY_ENABLED=True,
    PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
class TransactionalEmailTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('mail-owner', email='owner@example.test', password='Before123!')
        self.advertiser = Advertiser.objects.create(user=self.user, name='Owner', email=self.user.email)

    def test_welcome_once_after_account_linked_and_multipart_escaped(self):
        self.advertiser.save()
        self.assertEqual(TransactionalEmail.objects.filter(kind='welcome').count(), 1)
        process_outbox()
        process_outbox()
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('nao-responda@guiacomararaquara.com.br', mail.outbox[0].from_email)
        self.assertNotIn('Before123!', mail.outbox[0].body)
        self.assertEqual(mail.outbox[0].alternatives[0].mimetype, 'text/html')
        deliver('owner@example.test', 'Cadastro', ['<script>alert(1)</script>'])
        self.assertNotIn('<script>', mail.outbox[-1].alternatives[0].content)
        self.assertIn('&lt;script&gt;', mail.outbox[-1].alternatives[0].content)

    def test_activation_after_link_and_disabled_account_guard(self):
        self.user.is_active = False
        self.user.save()
        process_outbox()
        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(TransactionalEmail.objects.get(kind='welcome').status, 'expired')
        other = Advertiser.objects.create(name='Not linked')
        self.assertEqual(TransactionalEmail.objects.count(), 1)
        other.user = get_user_model().objects.create_user('linked-later', email='later@example.test')
        other.save()
        self.assertEqual(TransactionalEmail.objects.filter(kind='welcome').count(), 2)

    def test_password_notice_and_email_change_to_both_addresses(self):
        self.user.set_password('After123!')
        self.user.save(update_fields=['password'])
        self.user.save()
        self.assertEqual(TransactionalEmail.objects.filter(kind='password_changed').count(), 1)
        self.user.email = 'new@example.test'
        self.user.save()
        self.assertEqual(set(TransactionalEmail.objects.filter(kind='email_changed').values_list('recipient', flat=True)),
            {'owner@example.test', 'new@example.test'})

    def test_transaction_rollback_does_not_leave_queued_email(self):
        initial = TransactionalEmail.objects.count()
        with self.assertRaises(RuntimeError):
            with transaction.atomic():
                enqueue('test', 'recipient@example.test', 'Test', ['Test'])
                raise RuntimeError('rollback')
        self.assertEqual(TransactionalEmail.objects.count(), initial)

    def test_retry_backoff_and_no_duplicate_after_success(self):
        message = TransactionalEmail.objects.get()
        with patch('core.email_queue.deliver', side_effect=SMTPException('secret must not be logged')):
            self.assertEqual(process_outbox(), {'sent': 0, 'failed': 1})
        message.refresh_from_db()
        self.assertEqual(message.last_error, 'SMTPException')
        self.assertEqual(message.status, 'pending')
        self.assertEqual(message.attempts, 1)
        self.assertEqual(process_outbox()['sent'], 0)
        message.available_at = timezone.now() - timedelta(seconds=1)
        message.save()
        self.assertEqual(process_outbox()['sent'], 1)
        self.assertEqual(process_outbox()['sent'], 0)

    def test_retry_limit_expiry_and_claimed_rows_not_resent(self):
        message = TransactionalEmail.objects.get()
        message.attempts = 4
        message.save()
        with patch('core.email_queue.deliver', side_effect=OSError):
            process_outbox()
        message.refresh_from_db()
        self.assertEqual(message.status, 'failed')
        claimed = enqueue('test', 'test@example.test', 'Test', ['Test'])
        claimed.status = 'sending'
        claimed.save()
        expired = enqueue('test', 'test@example.test', 'Test', ['Test'])
        expired.expires_at = timezone.now() - timedelta(seconds=1)
        expired.save()
        self.assertEqual(process_outbox()['sent'], 0)
        expired.refresh_from_db()
        self.assertEqual(expired.status, 'expired')

    @override_settings(GCA_EMAIL_DELIVERY_ENABLED=False)
    def test_delivery_disabled_refuses_network(self):
        with self.assertRaises(ValueError), patch('core.email_queue.deliver') as send:
            process_outbox()
        send.assert_not_called()

    @override_settings(GCA_EMAIL_EVENTS_ENABLED=False)
    def test_capture_disabled_and_invalid_addresses(self):
        self.assertIsNone(enqueue('test', 'valid@example.test', 'Test', ['Test']))

    def test_invalid_recipient_and_duplicate_event_key(self):
        self.assertIsNone(enqueue('test', 'invalid', 'Test', ['Test']))
        a = enqueue('test', 'a@example.test', 'Test', ['Test'], key='unique')
        b = enqueue('test', 'a@example.test', 'Test', ['Test'], key='unique')
        self.assertEqual(a.pk, b.pk)

    def test_business_transitions_do_not_resend_on_unrelated_edit(self):
        business = Business.objects.create(name='Store', street='Rua', number='1', email='store@example.test', status='pending')
        self.assertEqual(TransactionalEmail.objects.filter(kind='business_pending').count(), 1)
        business.status = 'active'
        business.save()
        business.name = 'New name'
        business.save()
        self.assertEqual(TransactionalEmail.objects.filter(kind='business_active').count(), 1)
        process_outbox()
        self.assertEqual(TransactionalEmail.objects.get(kind='business_pending').status, 'expired')

    def test_invoice_reminders_idempotent_and_cancelled_after_payment(self):
        business = Business.objects.create(name='Store', street='Rua', number='1')
        plan = AdvertisingPlan.objects.create(name='Basic', price=Decimal('10'))
        today = timezone.localdate()
        subscription = AdvertisingSubscription.objects.create(advertiser=self.advertiser, business=business,
            plan=plan, start_date=today, next_due_date=today, agreed_price=Decimal('10'))
        invoice = Invoice.objects.create(subscription=subscription, reference_month=today.replace(day=1),
            due_date=today, amount=Decimal('10'))
        queue_reminders(today)
        queue_reminders(today)
        self.assertEqual(TransactionalEmail.objects.filter(kind='invoice_reminder').count(), 1)
        invoice.status = 'paid'
        invoice.save()
        process_outbox()
        self.assertEqual(TransactionalEmail.objects.get(kind='invoice_reminder').status, 'expired')
        self.assertEqual(TransactionalEmail.objects.get(kind='invoice_open').status, 'expired')
        self.assertEqual(TransactionalEmail.objects.get(kind='invoice_paid').status, 'sent')
