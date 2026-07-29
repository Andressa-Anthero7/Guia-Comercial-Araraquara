from django.contrib.auth import authenticate, login, logout
from datetime import timedelta
from django.db.models import Q, Sum
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response

from .models import (
    Advertiser,
    AdvertisingPlan,
    AdvertisingSubscription,
    Business,
    Category,
    Coupon,
    Event,
    Invoice,
    Review,
    UsefulNumber,
)
from .serializers import (
    BackofficeBusinessSerializer,
    BackofficeCouponSerializer,
    BackofficeEventSerializer,
    BackofficeUsefulNumberSerializer,
    BusinessSerializer,
    CategorySerializer,
    CouponSerializer,
    EventSerializer,
    ReviewSerializer,
    UsefulNumberSerializer,
    AdvertiserSerializer,
    AdvertisingPlanSerializer,
    AdvertisingSubscriptionSerializer,
    InvoiceSerializer,
)


@api_view(["GET"])
def health_check(request):
    return Response({"status": "ok", "service": "Guia Comercial Araraquara API"})


@api_view(["GET"])
@ensure_csrf_cookie
def csrf_cookie(request):
    return Response({"csrf": "set"})


@api_view(["POST"])
def backoffice_login(request):
    username = request.data.get("username", "")
    password = request.data.get("password", "")
    user = authenticate(request, username=username, password=password)
    if user is None or not user.is_staff:
        return Response(
            {"detail": "Usuario ou senha invalidos."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    login(request, user)
    return Response({
        "is_authenticated": True,
        "is_backoffice": True,
        "username": user.get_username(),
        "name": user.get_full_name(),
        "email": user.email,
    })


@api_view(["POST"])
def backoffice_logout(request):
    logout(request)
    return Response({"is_authenticated": False, "is_backoffice": False})


@api_view(["GET"])
def backoffice_session(request):
    user = request.user
    return Response(
        {
            "is_authenticated": user.is_authenticated,
            "is_backoffice": user.is_authenticated and user.is_staff,
            "username": user.get_username() if user.is_authenticated else "",
            "name": user.get_full_name() if user.is_authenticated else "",
            "email": user.email if user.is_authenticated else "",
        }
    )


@api_view(["GET"])
def finance_summary(request):
    if not request.user.is_staff:
        return Response({"detail": "Acesso nao autorizado."}, status=status.HTTP_403_FORBIDDEN)

    today = timezone.localdate()
    invoices = Invoice.objects.exclude(status=Invoice.Status.CANCELLED)
    open_invoices = invoices.filter(status=Invoice.Status.OPEN)
    overdue = open_invoices.filter(due_date__lt=today)
    due_soon = open_invoices.filter(due_date__gte=today, due_date__lte=today + timedelta(days=7))
    paid_this_month = invoices.filter(
        status=Invoice.Status.PAID,
        paid_at__year=today.year,
        paid_at__month=today.month,
    )

    def total(queryset):
        values = queryset.aggregate(
            amount=Sum("amount"), discount=Sum("discount"), late_fee=Sum("late_fee")
        )
        return (
            (values["amount"] or 0)
            - (values["discount"] or 0)
            + (values["late_fee"] or 0)
        )

    return Response({
        "active_advertisers": Advertiser.objects.filter(status=Advertiser.Status.ACTIVE).count(),
        "active_subscriptions": AdvertisingSubscription.objects.filter(
            status=AdvertisingSubscription.Status.ACTIVE
        ).count(),
        "open_amount": total(open_invoices),
        "overdue_amount": total(overdue),
        "overdue_count": overdue.count(),
        "due_soon_count": due_soon.count(),
        "received_this_month": total(paid_this_month),
    })


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = "slug"


class BusinessViewSet(
    mixins.CreateModelMixin,
    viewsets.ReadOnlyModelViewSet,
):
    serializer_class = BusinessSerializer
    lookup_field = "slug"
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = (
            Business.objects.filter(status=Business.Status.ACTIVE)
            .select_related("category")
            .prefetch_related("tags")
        )

        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category__slug=category)

        city = self.request.query_params.get("city")
        if city:
            queryset = queryset.filter(city__iexact=city)

        neighborhood = self.request.query_params.get("neighborhood")
        if neighborhood:
            queryset = queryset.filter(neighborhood__iexact=neighborhood)

        featured = self.request.query_params.get("featured")
        if featured in {"true", "1"}:
            queryset = queryset.filter(is_featured=True)

        query = self.request.query_params.get("q")
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query)
                | Q(description__icontains=query)
                | Q(street__icontains=query)
                | Q(neighborhood__icontains=query)
                | Q(tags__name__icontains=query)
            ).distinct()

        return queryset


class BackofficeBusinessViewSet(viewsets.ModelViewSet):
    serializer_class = BackofficeBusinessSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "slug"

    def get_queryset(self):
        return (
            Business.objects.all()
            .select_related("category")
            .prefetch_related("tags", "reviews")
            .order_by("-updated_at")
        )


class ReviewViewSet(
    mixins.CreateModelMixin,
    viewsets.ReadOnlyModelViewSet,
):
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Review.objects.filter(is_approved=True).select_related("business")
        business = self.request.query_params.get("business")
        if business:
            queryset = queryset.filter(business__slug=business)
        return queryset


class CouponViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CouponSerializer

    def get_queryset(self):
        today = timezone.localdate()
        queryset = Coupon.objects.filter(
            is_active=True,
            business__status=Business.Status.ACTIVE,
        ).filter(
            Q(starts_at__isnull=True) | Q(starts_at__lte=today),
            Q(expires_at__isnull=True) | Q(expires_at__gte=today),
        ).select_related("business")

        business = self.request.query_params.get("business")
        if business:
            queryset = queryset.filter(business__slug=business)

        return queryset


class BackofficeCouponViewSet(viewsets.ModelViewSet):
    serializer_class = BackofficeCouponSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Coupon.objects.all().select_related("business").order_by("-created_at")

        business = self.request.query_params.get("business")
        if business:
            queryset = queryset.filter(business__slug=business)

        active = self.request.query_params.get("active")
        if active in {"true", "1"}:
            queryset = queryset.filter(is_active=True)
        elif active in {"false", "0"}:
            queryset = queryset.filter(is_active=False)

        query = self.request.query_params.get("q")
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(discount_code__icontains=query)
                | Q(description__icontains=query)
                | Q(business__name__icontains=query)
            )

        return queryset


class EventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EventSerializer

    def get_queryset(self):
        queryset = Event.objects.filter(is_published=True)

        query = self.request.query_params.get("q")
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(location__icontains=query)
                | Q(description__icontains=query)
            )

        return queryset


class BackofficeEventViewSet(viewsets.ModelViewSet):
    serializer_class = BackofficeEventSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Event.objects.all().order_by("-created_at")

        published = self.request.query_params.get("published")
        if published in {"true", "1"}:
            queryset = queryset.filter(is_published=True)
        elif published in {"false", "0"}:
            queryset = queryset.filter(is_published=False)

        query = self.request.query_params.get("q")
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(location__icontains=query)
                | Q(description__icontains=query)
            )

        return queryset


class UsefulNumberViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UsefulNumberSerializer

    def get_queryset(self):
        queryset = UsefulNumber.objects.filter(is_active=True)

        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)

        query = self.request.query_params.get("q")
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query)
                | Q(phone__icontains=query)
                | Q(description__icontains=query)
            )

        return queryset


class BackofficeUsefulNumberViewSet(viewsets.ModelViewSet):
    serializer_class = BackofficeUsefulNumberSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = UsefulNumber.objects.all()

        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)

        active = self.request.query_params.get("active")
        if active in {"true", "1"}:
            queryset = queryset.filter(is_active=True)
        elif active in {"false", "0"}:
            queryset = queryset.filter(is_active=False)

        query = self.request.query_params.get("q")
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query)
                | Q(phone__icontains=query)
                | Q(description__icontains=query)
            )

        return queryset


class AdvertiserViewSet(viewsets.ModelViewSet):
    serializer_class = AdvertiserSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Advertiser.objects.prefetch_related("businesses").order_by("name")


class AdvertisingPlanViewSet(viewsets.ModelViewSet):
    serializer_class = AdvertisingPlanSerializer
    permission_classes = [IsAdminUser]
    queryset = AdvertisingPlan.objects.all()


class AdvertisingSubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = AdvertisingSubscriptionSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return AdvertisingSubscription.objects.select_related(
            "advertiser", "business", "plan"
        )


class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Invoice.objects.select_related(
            "subscription__advertiser", "subscription__business", "subscription__plan"
        )
