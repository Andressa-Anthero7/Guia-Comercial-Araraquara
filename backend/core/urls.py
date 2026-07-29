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

urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("auth/csrf/", csrf_cookie, name="csrf-cookie"),
    path("auth/login/", backoffice_login, name="backoffice-login"),
    path("auth/logout/", backoffice_logout, name="backoffice-logout"),
    path("auth/session/", backoffice_session, name="backoffice-session"),
    path("", include(router.urls)),
]
