"""Current subscriptions override manual plan flags; history is never erased."""
from django.utils import timezone
from django.db.models import Exists, OuterRef, Q, Subquery
from .models import AdvertisingSubscription, Business


def businesses_with_coupons():
    today = timezone.localdate()
    subscriptions = AdvertisingSubscription.objects.filter(business_id=OuterRef("pk"))
    current = subscriptions.filter(status="active", advertiser__status="active", plan__is_active=True,
        start_date__lte=today).filter(Q(end_date__isnull=True) | Q(end_date__gte=today)).order_by("-start_date", "-pk")
    return Business.objects.alias(has_contract=Exists(subscriptions),
        coupons_allowed=Subquery(current.values("plan__includes_coupons")[:1])).filter(
            Q(has_contract=False, plan_type="paid") | Q(coupons_allowed=True))


def business_benefits(business, today=None):
    today = today or timezone.localdate()
    subscriptions = list(business.subscriptions.select_related("plan", "advertiser").order_by("-start_date", "-pk"))
    active = next((s for s in subscriptions if s.status == "active" and s.advertiser.status == "active"
                   and s.plan.is_active and s.start_date <= today and (s.end_date is None or s.end_date >= today)), None)
    if active:
        plan = active.plan
        paid = plan.plan_type == "paid"
        return {"plan_type": plan.plan_type, "max_images": plan.max_images, "max_ads": plan.max_ads,
                "featured": paid and plan.featured, "includes_coupons": plan.includes_coupons,
                "includes_marketing": paid and plan.includes_marketing,
                "includes_custom_page": paid and plan.includes_custom_page, "source": "subscription"}
    paid = not subscriptions and business.plan_type == "paid"
    return {"plan_type": "paid" if paid else "free", "max_images": 5 if paid else 1, "max_ads": 1,
            "featured": paid, "includes_coupons": paid, "includes_marketing": paid,
            "includes_custom_page": paid, "source": "manual" if not subscriptions else "expired_subscription"}
