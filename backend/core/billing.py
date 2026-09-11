"""Recurring invoice generation. Existing payments and cancellations are preserved."""
import calendar
from datetime import date

from django.db import transaction
from django.utils import timezone

from .models import AdvertisingSubscription, Invoice

MONTHS = {"monthly": 1, "quarterly": 3, "semiannual": 6, "annual": 12}


def next_cycle(due, months, anchor_day):
    month = due.year * 12 + due.month - 1 + months
    year, zero_month = divmod(month, 12)
    return date(year, zero_month + 1, min(anchor_day, calendar.monthrange(year, zero_month + 1)[1]))


def renew_subscriptions(today=None):
    today = today or timezone.localdate()
    result = {"created": 0, "existing": 0, "processed": 0}
    ids = AdvertisingSubscription.objects.filter(status="active", auto_renew=True,
        start_date__lte=today, next_due_date__lte=today).values_list("pk", flat=True)
    for pk in list(ids):
        with transaction.atomic():
            subscription = AdvertisingSubscription.objects.select_for_update().select_related("plan", "business").get(pk=pk)
            if subscription.status != "active" or not subscription.auto_renew:
                continue
            due = subscription.next_due_date
            anchor = subscription.billing_anchor_day or due.day
            months = MONTHS[subscription.plan.billing_cycle]
            # Bound one run; repeated runs continue an old backlog without duplicates.
            for _ in range(120):
                if due > today or (subscription.end_date and due > subscription.end_date):
                    break
                if due >= subscription.start_date:
                    if subscription.invoices.filter(due_date=due).exists():
                        result["existing"] += 1
                    else:
                        _, created = Invoice.objects.get_or_create(recurrence_key=f"subscription:{pk}:{due.isoformat()}", defaults={
                            "subscription": subscription, "description": f"{subscription.plan.name} — {due:%m/%Y}",
                            "reference_month": due.replace(day=1), "due_date": due, "amount": subscription.agreed_price,
                            "status": Invoice.Status.OVERDUE if due < today else Invoice.Status.OPEN,
                        })
                        result["created" if created else "existing"] += 1
                due = next_cycle(due, months, anchor)
            subscription.next_due_date = due
            subscription.billing_anchor_day = anchor
            subscription.save(update_fields=["next_due_date", "billing_anchor_day", "updated_at"])
            result["processed"] += 1
    return result
