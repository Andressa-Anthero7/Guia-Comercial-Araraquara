from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BackofficeBusinessViewSet,
    BackofficeCouponViewSet,
    BackofficeEventViewSet,
    BackofficeUsefulNumberViewSet,
    BusinessViewSet,
    CategoryViewSet,
    CouponViewSet,
    EventViewSet,
    ReviewViewSet,
    UsefulNumberViewSet,
    backoffice_login,
    backoffice_logout,
    backoffice_session,
    csrf_cookie,
    health_check,
    finance_summary,
    advertiser_portal,
    advertiser_login,
    advertiser_profile,
    advertiser_business,
    advertiser_coupon,
    advertiser_advertisement,
    AdvertiserViewSet,
    AdvertisingPlanViewSet,
    AdvertisingSubscriptionViewSet,
    InvoiceViewSet,
    AdvertisementViewSet,
    BackofficeNotificationViewSet,
    push_config,
    push_subscription,
)

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("businesses", BusinessViewSet, basename="business")
router.register("reviews", ReviewViewSet, basename="review")
router.register("coupons", CouponViewSet, basename="coupon")
router.register("events", EventViewSet, basename="event")
router.register("useful-numbers", UsefulNumberViewSet, basename="useful-number")
router.register("backoffice/businesses", BackofficeBusinessViewSet, basename="backoffice-business")
router.register("backoffice/coupons", BackofficeCouponViewSet, basename="backoffice-coupon")
router.register("backoffice/events", BackofficeEventViewSet, basename="backoffice-event")
router.register("backoffice/useful-numbers", BackofficeUsefulNumberViewSet, basename="backoffice-useful-number")
router.register("backoffice/advertisers", AdvertiserViewSet, basename="backoffice-advertiser")
router.register("backoffice/plans", AdvertisingPlanViewSet, basename="backoffice-plan")
router.register("backoffice/subscriptions", AdvertisingSubscriptionViewSet, basename="backoffice-subscription")
router.register("backoffice/invoices", InvoiceViewSet, basename="backoffice-invoice")
router.register("backoffice/advertisements", AdvertisementViewSet, basename="backoffice-advertisement")
router.register("backoffice/notifications", BackofficeNotificationViewSet, basename="backoffice-notification")

urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("auth/csrf/", csrf_cookie, name="csrf-cookie"),
    path("auth/login/", backoffice_login, name="backoffice-login"),
    path("auth/advertiser/login/", advertiser_login, name="advertiser-login"),
    path("auth/logout/", backoffice_logout, name="backoffice-logout"),
    path("auth/session/", backoffice_session, name="backoffice-session"),
    path("backoffice/finance-summary/", finance_summary, name="finance-summary"),
    path("advertiser/portal/", advertiser_portal, name="advertiser-portal"),
    path("advertiser/profile/", advertiser_profile, name="advertiser-profile"),
    path("advertiser/businesses/<slug:slug>/", advertiser_business, name="advertiser-business"),
    path("advertiser/coupons/", advertiser_coupon, name="advertiser-coupon-create"),
    path("advertiser/coupons/<int:coupon_id>/", advertiser_coupon, name="advertiser-coupon"),
    path("advertiser/advertisements/<int:advertisement_id>/", advertiser_advertisement, name="advertiser-advertisement"),
    path("backoffice/push/config/", push_config, name="push-config"),
    path("backoffice/push/subscription/", push_subscription, name="push-subscription"),
    path("", include(router.urls)),
]
