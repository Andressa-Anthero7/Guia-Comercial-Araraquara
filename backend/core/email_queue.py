"""Durable outbox. Workers claim rows before SMTP; no network calls in signals."""
from datetime import timedelta
from smtplib import SMTPException
from uuid import uuid4

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.utils import timezone

from .email_service import deliver, email_connection
from .models import TransactionalEmail


def enqueue(kind, recipient, title, paragraphs, *, url='', key=None, guard=None):
    if not getattr(settings, 'GCA_EMAIL_EVENTS_ENABLED', False):
        return None
    try:
        validate_email(recipient)
    except ValidationError:
        return None
    message, _ = TransactionalEmail.objects.get_or_create(
        event_key=key or str(uuid4()), defaults={'kind': kind, 'recipient': recipient,
            'title': title, 'paragraphs': paragraphs, 'url': url, 'guard': guard or {},
            'expires_at': timezone.now() + timedelta(days=7)})
    return message


def process_outbox(limit=100):
    if not getattr(settings, 'GCA_EMAIL_DELIVERY_ENABLED', False):
        raise ValueError('GCA_EMAIL_DELIVERY_ENABLED is disabled')
    connection = email_connection()
    if connection is None:
        raise ValueError('SMTP is not configured')
    now = timezone.now()
    TransactionalEmail.objects.filter(status='pending', expires_at__lte=now).update(status='expired')
    ids = list(TransactionalEmail.objects.filter(status='pending', available_at__lte=now).order_by('created_at').values_list('pk', flat=True)[:limit])
    totals = {'sent': 0, 'failed': 0}
    for pk in ids:
        if not TransactionalEmail.objects.filter(pk=pk, status='pending').update(status='sending'):
            continue
        message = TransactionalEmail.objects.get(pk=pk)
        if message.guard:
            from .models import Business, Invoice, Advertiser
            models = {'Business': Business, 'Invoice': Invoice, 'Advertiser': Advertiser}
            model = models.get(message.guard.get('model'))
            if model is None or not model.objects.filter(**message.guard.get('filters', {})).exists():
                message.status = 'expired'
                message.last_error = 'EventNoLongerApplicable'
                message.save(update_fields=['status', 'last_error'])
                continue
        message.attempts += 1
        try:
            deliver(message.recipient, message.title, message.paragraphs, url=message.url,
                connection=connection, message_id=f'<gca-{message.pk}@guiacomararaquara.com.br>')
        except (SMTPException, OSError, ValueError) as error:
            message.status = 'failed' if message.attempts >= 5 else 'pending'
            message.last_error = type(error).__name__  # no SMTP credentials, tokens or personal data
            message.available_at = timezone.now() + timedelta(minutes=2 ** message.attempts)
            totals['failed'] += 1
        else:
            message.status = 'sent'
            message.sent_at = timezone.now()
            message.last_error = ''
            totals['sent'] += 1
        message.save(update_fields=['attempts', 'status', 'last_error', 'available_at', 'sent_at'])
    return totals
