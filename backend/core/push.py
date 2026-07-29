import json
import os

from pywebpush import WebPushException, webpush

from .models import PushSubscription


def send_notification_push(notification):
    private_key = os.environ.get("WEBPUSH_VAPID_PRIVATE_KEY", "")
    subject = os.environ.get(
        "WEBPUSH_VAPID_SUBJECT", "mailto:admin@guiacomararaquara.com.br"
    )
    if not private_key:
        return

    subscriptions = PushSubscription.objects.filter(is_active=True)
    if notification.recipient_id:
        subscriptions = subscriptions.filter(user_id=notification.recipient_id)

    payload = json.dumps(
        {
            "title": notification.title,
            "body": notification.message,
            "url": notification.url or "/backoffice",
            "tag": notification.unique_key,
            "icon": "/assets/brand-logo.png",
        }
    )
    for subscription in subscriptions.iterator():
        try:
            webpush(
                subscription_info={
                    "endpoint": subscription.endpoint,
                    "keys": {
                        "p256dh": subscription.p256dh,
                        "auth": subscription.auth,
                    },
                },
                data=payload,
                vapid_private_key=private_key,
                vapid_claims={"sub": subject},
                ttl=86400,
            )
        except WebPushException as error:
            response = getattr(error, "response", None)
            if response is not None and response.status_code in {404, 410}:
                subscription.is_active = False
                subscription.save(update_fields=("is_active", "updated_at"))
