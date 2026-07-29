from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import (
    Advertisement,
    BackofficeNotification,
    Business,
    Review,
)
from .push import send_notification_push


def create_notification(unique_key, **defaults):
    return BackofficeNotification.objects.get_or_create(
        unique_key=unique_key, defaults=defaults
    )


@receiver(post_save, sender=Business)
def notify_pending_business(sender, instance, created, **kwargs):
    if created and instance.status == Business.Status.PENDING:
        create_notification(
            f"business-pending-{instance.pk}",
            kind=BackofficeNotification.Kind.REGISTRATION,
            title="Novo estabelecimento pendente",
            message=f"{instance.name} aguarda analise e publicacao.",
            url="/backoffice",
        )


@receiver(post_save, sender=Advertisement)
def notify_advertisement_review(sender, instance, created, **kwargs):
    if instance.status == Advertisement.Status.REVIEW:
        create_notification(
            f"advertisement-review-{instance.pk}-{instance.updated_at:%Y%m%d%H%M%S}",
            kind=BackofficeNotification.Kind.ADVERTISEMENT,
            title="Anuncio enviado para revisao",
            message=f"{instance.title} ({instance.business.name}) aguarda aprovacao.",
            url="/backoffice/comercial",
        )


@receiver(post_save, sender=Review)
def notify_new_review(sender, instance, created, **kwargs):
    if created:
        create_notification(
            f"review-pending-{instance.pk}",
            kind=BackofficeNotification.Kind.REVIEW,
            title="Nova avaliacao recebida",
            message=f"{instance.author_name} avaliou {instance.business.name}.",
            url="/backoffice",
        )


@receiver(post_save, sender=BackofficeNotification)
def dispatch_push(sender, instance, created, **kwargs):
    if created:
        transaction.on_commit(lambda: send_notification_push(instance))
