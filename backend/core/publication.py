"""One public visibility rule for profiles, photos, reviews and coupons.

A principal campaign controls the listing's publication window. Dates are
inclusive in the site's local timezone; pausing it withdraws the listing without
deleting any business or campaign data. Businesses without a campaign keep
their explicit publication status.
"""
from django.db.models import Exists, OuterRef, Q
from django.utils import timezone

from .models import Advertisement, Business


def public_businesses(today=None):
    today = today or timezone.localdate()
    principal = Advertisement.objects.filter(business_id=OuterRef("pk"), is_primary=True)
    live = principal.filter(status=Advertisement.Status.PUBLISHED).filter(
        Q(starts_at__isnull=True) | Q(starts_at__lte=today),
        Q(ends_at__isnull=True) | Q(ends_at__gte=today),
    )
    return Business.objects.filter(status=Business.Status.ACTIVE).alias(
        has_principal=Exists(principal), has_live_principal=Exists(live)
    ).filter(Q(has_principal=False) | Q(has_live_principal=True))
