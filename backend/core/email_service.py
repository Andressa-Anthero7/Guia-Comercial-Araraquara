"""Transactional mail transport and shared, escaped text/HTML presentation."""
import os
from urllib.parse import urlsplit

from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string


def email_connection():
    backend = settings.EMAIL_BACKEND
    if backend != 'django.core.mail.backends.smtp.EmailBackend':
        return get_connection(backend=backend)
    host = os.environ.get('EMAIL_HOST', settings.EMAIL_HOST)
    if not host or host == 'localhost':
        return None
    ssl = os.environ.get('EMAIL_USE_SSL', str(settings.EMAIL_USE_SSL)).lower() == 'true'
    tls = os.environ.get('EMAIL_USE_TLS', 'false' if ssl else 'true').lower() == 'true'
    try:
        port = int(os.environ.get('EMAIL_PORT', '465' if ssl else '587'))
    except ValueError:
        return None
    if not 1 <= port <= 65535 or (ssl and tls):
        return None
    return get_connection(host=host, port=port,
        username=os.environ.get('EMAIL_HOST_USER', settings.EMAIL_HOST_USER),
        password=os.environ.get('EMAIL_HOST_PASSWORD', settings.EMAIL_HOST_PASSWORD),
        use_ssl=ssl, use_tls=tls, timeout=15)


def portal_url(path='/area-do-anunciante'):
    origin = os.environ.get('GCA_AUTH_ORIGIN', 'https://guiacomararaquara.com.br').rstrip('/')
    parsed = urlsplit(origin)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path:
        raise ValueError('GCA_AUTH_ORIGIN must be an HTTPS origin without a path')
    return origin + path


def deliver(recipient, title, paragraphs, *, url='', action='Acessar minha conta', connection=None, message_id=None):
    connection = connection or email_connection()
    if connection is None:
        raise OSError('SMTP is not configured')
    context = {'title': title, 'paragraphs': paragraphs, 'url': url, 'action': action}
    message = EmailMultiAlternatives(
        subject=f'{title} — Guia Comercial Araraquara',
        body=render_to_string('core/emails/transactional.txt', context),
        from_email=os.environ.get('DEFAULT_FROM_EMAIL', settings.DEFAULT_FROM_EMAIL),
        to=[recipient], connection=connection,
        headers={'Message-ID': message_id} if message_id else None,
    )
    message.attach_alternative(render_to_string('core/emails/transactional.html', context), 'text/html')
    if message.send() != 1:
        raise OSError('Mail backend did not accept the message')
