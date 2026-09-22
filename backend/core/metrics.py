from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone
from rest_framework.throttling import SimpleRateThrottle

from .models import BusinessDailyMetric

EVENTS = {"view", "whatsapp", "phone", "email", "website", "instagram", "map"}


class MetricThrottle(SimpleRateThrottle):
    scope = "business_metrics"
    rate = "60/min"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


def advertiser_metrics(businesses):
    end = timezone.localdate()
    start = end - timedelta(days=29)
    totals = list(BusinessDailyMetric.objects.filter(business__in=businesses, day__range=(start, end))
                  .values("business_id", "business__name", "event").annotate(count=Sum("count"))
                 .order_by("business_id", "event"))
    return {"start": start.isoformat(), "end": end.isoformat(), "totals": totals}
