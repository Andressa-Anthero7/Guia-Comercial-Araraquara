from django.contrib.auth import authenticate, login, logout
from datetime import timedelta
import os
from django.db.models import Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from .management import ManagedWritesMixin
from .images import image_response

from .models import (
    Advertiser,
    AdvertisingPlan,
    AdvertisingSubscription,
    Advertisement,
    Business,
    BackofficeNotification,
    Category,
    Coupon,
    Event,
    Invoice,
    PushSubscription,
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
    AdvertisementSerializer,
    InvoiceSerializer,
    BackofficeNotificationSerializer,
    PushSubscriptionSerializer,
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
        "is_superuser": user.is_superuser,
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
    is_advertiser = (
        user.is_authenticated
        and Advertiser.objects.filter(user=user, status=Advertiser.Status.ACTIVE).exists()
    )
    return Response(
        {
            "is_authenticated": user.is_authenticated,
            "is_backoffice": user.is_authenticated and user.is_staff,
            "is_superuser": user.is_authenticated and user.is_superuser,
            "is_advertiser": is_advertiser,
            "username": user.get_username() if user.is_authenticated else "",
            "name": user.get_full_name() if user.is_authenticated else "",
            "email": user.email if user.is_authenticated else "",
        }
    )


def active_advertiser_for(request):
    if not request.user.is_authenticated:
        return None
    return Advertiser.objects.filter(
        user=request.user,
        status=Advertiser.Status.ACTIVE,
    ).prefetch_related("businesses").first()


@api_view(["POST"])
def advertiser_login(request):
    username = request.data.get("username", "")
    password = request.data.get("password", "")
    user = authenticate(request, username=username, password=password)
    advertiser = (
        Advertiser.objects.filter(user=user, status=Advertiser.Status.ACTIVE).first()
        if user is not None
        else None
    )
    if advertiser is None:
        return Response(
            {"detail": "Usuario ou senha invalidos para a area do anunciante."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    login(request, user)
    return Response({
        "is_authenticated": True,
        "is_backoffice": user.is_staff,
        "is_superuser": user.is_superuser,
        "is_advertiser": True,
        "username": user.get_username(),
        "name": user.get_full_name() or advertiser.contact_name or advertiser.name,
        "email": user.email,
    })


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
    for invoice in overdue[:25]:
        BackofficeNotification.objects.get_or_create(
            unique_key=f"invoice-overdue-{invoice.pk}-{invoice.due_date}",
            defaults={
                "kind": BackofficeNotification.Kind.FINANCE,
                "title": "Cobranca vencida",
                "message": (
                    f"{invoice.subscription.advertiser.name} possui uma cobranca "
                    f"vencida em {invoice.due_date:%d/%m/%Y}."
                ),
                "url": "/backoffice/financeiro",
            },
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


@api_view(["GET"])
def advertiser_portal(request):
    """Self-service data for the authenticated advertiser linked to the account."""
    if not request.user.is_authenticated:
        return Response({"detail": "Autenticacao necessaria."}, status=status.HTTP_401_UNAUTHORIZED)
    advertiser = active_advertiser_for(request)
    if not advertiser:
        return Response({"detail": "Nenhum perfil de anunciante vinculado a este usuario."}, status=status.HTTP_404_NOT_FOUND)
    businesses = advertiser.businesses.prefetch_related("advertisements", "coupons")
    return Response({
        "advertiser": AdvertiserSerializer(advertiser).data,
        "businesses": BackofficeBusinessSerializer(businesses, many=True).data,
        "advertisements": AdvertisementSerializer(Advertisement.objects.filter(business__in=businesses), many=True).data,
        "coupons": BackofficeCouponSerializer(Coupon.objects.filter(business__in=businesses), many=True).data,
        "subscriptions": AdvertisingSubscriptionSerializer(AdvertisingSubscription.objects.filter(advertiser=advertiser), many=True).data,
        "invoices": InvoiceSerializer(Invoice.objects.filter(subscription__advertiser=advertiser), many=True).data,
    })


@api_view(["PATCH"])
def advertiser_profile(request):
    advertiser = active_advertiser_for(request)
    if advertiser is None:
        return Response({"detail": "Acesso nao autorizado."}, status=status.HTTP_403_FORBIDDEN)
    allowed_fields = {"name", "document", "contact_name", "email", "phone", "billing_email"}
    serializer = AdvertiserSerializer(
        advertiser,
        data={key: value for key, value in request.data.items() if key in allowed_fields},
        partial=True,
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(["PATCH"])
def advertiser_business(request, slug):
    advertiser = active_advertiser_for(request)
    if advertiser is None:
        return Response({"detail": "Acesso nao autorizado."}, status=status.HTTP_403_FORBIDDEN)
    business = advertiser.businesses.filter(slug=slug).first()
    if business is None:
        return Response({"detail": "Estabelecimento nao encontrado."}, status=status.HTTP_404_NOT_FOUND)
    allowed_fields = {
        "name", "description", "services_products", "category", "street", "number",
        "complement", "neighborhood", "city", "state", "postal_code", "phone", "phone_whatsapp",
        "email", "website", "instagram", "logo_image", "image_url", "images",
        "opening_hours", "tags",
    }
    serializer = BackofficeBusinessSerializer(
        business,
        data={key: value for key, value in request.data.items() if key in allowed_fields},
        partial=True,
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(["POST", "PATCH"])
def advertiser_coupon(request, coupon_id=None):
    advertiser = active_advertiser_for(request)
    if advertiser is None:
        return Response({"detail": "Acesso nao autorizado."}, status=status.HTTP_403_FORBIDDEN)
    if coupon_id is None:
        serializer = BackofficeCouponSerializer(data=request.data)
    else:
        coupon = Coupon.objects.filter(pk=coupon_id, business__advertisers=advertiser).first()
        if coupon is None:
            return Response({"detail": "Cupom nao encontrado."}, status=status.HTTP_404_NOT_FOUND)
        serializer = BackofficeCouponSerializer(coupon, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    business = serializer.validated_data.get("business")
    if business is not None and not advertiser.businesses.filter(pk=business.pk).exists():
        return Response({"business": "Este estabelecimento nao pertence ao anunciante."}, status=status.HTTP_403_FORBIDDEN)
    coupon = serializer.save()
    return Response(BackofficeCouponSerializer(coupon).data, status=status.HTTP_201_CREATED if coupon_id is None else status.HTTP_200_OK)


@api_view(["PATCH"])
def advertiser_advertisement(request, advertisement_id):
    advertiser = active_advertiser_for(request)
    if advertiser is None:
        return Response({"detail": "Acesso nao autorizado."}, status=status.HTTP_403_FORBIDDEN)
    advertisement = Advertisement.objects.filter(
        pk=advertisement_id,
        business__advertisers=advertiser,
    ).first()
    if advertisement is None:
        return Response({"detail": "Anuncio nao encontrado."}, status=status.HTTP_404_NOT_FOUND)
    allowed_fields = {
        "title", "short_description", "description", "call_to_action", "destination_url",
        "logo_image", "cover_image", "video_url", "tags", "media", "starts_at", "ends_at",
    }
    data = {key: value for key, value in request.data.items() if key in allowed_fields}
    data["status"] = Advertisement.Status.REVIEW
    serializer = AdvertisementSerializer(advertisement, data=data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


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
            .prefetch_related("tags", "images")
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

    @action(detail=True, methods=["get"], url_path="cover")
    def cover(self, request, slug=None):
        """Entrega capas Base64 como imagem separada e cacheavel."""
        business = self.get_object()
        return image_response(business.image_url)

    @action(detail=True, methods=["get"], url_path=r"images/(?P<image_id>[0-9]+)")
    def gallery_image(self, request, slug=None, image_id=None):
        business = self.get_object()
        item = get_object_or_404(business.images, pk=image_id)
        return image_response(item.image)


class BackofficeBusinessViewSet(ManagedWritesMixin, viewsets.ModelViewSet):
    serializer_class = BackofficeBusinessSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "slug"

    def get_queryset(self):
        return (
            Business.objects.all()
            .select_related("category")
            .prefetch_related("tags", "reviews", "images")
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


class BackofficeCouponViewSet(ManagedWritesMixin, viewsets.ModelViewSet):
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


class BackofficeEventViewSet(ManagedWritesMixin, viewsets.ModelViewSet):
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


class BackofficeUsefulNumberViewSet(ManagedWritesMixin, viewsets.ModelViewSet):
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


class AdvertiserViewSet(ManagedWritesMixin, viewsets.ModelViewSet):
    serializer_class = AdvertiserSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Advertiser.objects.prefetch_related("businesses").order_by("name")


class AdvertisingPlanViewSet(ManagedWritesMixin, viewsets.ModelViewSet):
    serializer_class = AdvertisingPlanSerializer
    permission_classes = [IsAdminUser]
    queryset = AdvertisingPlan.objects.all()


class AdvertisingSubscriptionViewSet(ManagedWritesMixin, viewsets.ModelViewSet):
    serializer_class = AdvertisingSubscriptionSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return AdvertisingSubscription.objects.select_related(
            "advertiser", "business", "plan"
        )


class InvoiceViewSet(ManagedWritesMixin, viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Invoice.objects.select_related(
            "subscription__advertiser", "subscription__business", "subscription__plan"
        )


class AdvertisementViewSet(ManagedWritesMixin, viewsets.ModelViewSet):
    serializer_class = AdvertisementSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Advertisement.objects.select_related("business").prefetch_related(
            "tags", "media"
        )
        business = self.request.query_params.get("business")
        if business:
            queryset = queryset.filter(business_id=business)
        return queryset


class BackofficeNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BackofficeNotificationSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return BackofficeNotification.objects.filter(
            Q(recipient__isnull=True) | Q(recipient=self.request.user)
        ).prefetch_related("read_by")

    @action(detail=True, methods=["post"], url_path="read")
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.read_by.add(request.user)
        return Response({"status": "read"})

    @action(detail=False, methods=["post"], url_path="read-all")
    def mark_all_read(self, request):
        for notification in self.get_queryset():
            notification.read_by.add(request.user)
        return Response({"status": "all-read"})


@api_view(["GET"])
def push_config(request):
    if not request.user.is_staff:
        return Response({"detail": "Acesso nao autorizado."}, status=status.HTTP_403_FORBIDDEN)
    return Response({"public_key": os.environ.get("WEBPUSH_VAPID_PUBLIC_KEY", "")})


@api_view(["POST", "DELETE"])
def push_subscription(request):
    if not request.user.is_staff:
        return Response({"detail": "Acesso nao autorizado."}, status=status.HTTP_403_FORBIDDEN)
    if request.method == "DELETE":
        endpoint = request.data.get("endpoint", "")
        PushSubscription.objects.filter(user=request.user, endpoint=endpoint).update(
            is_active=False
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
    serializer = PushSubscriptionSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)
