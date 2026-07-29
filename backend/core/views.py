from django.contrib.auth import authenticate, login, logout
from django.db.models import Q
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response

from .models import Business, Category, Coupon, Event, Review, UsefulNumber
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
    return Response({"is_authenticated": True, "is_backoffice": True})


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
        }
    )


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
