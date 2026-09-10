import re

from rest_framework import serializers
from .management_rules import ManagementValidationMixin

from .models import (
    Advertiser,
    AdvertisingPlan,
    AdvertisingSubscription,
    Advertisement,
    AdvertisementMedia,
    Business,
    BusinessImage,
    BackofficeNotification,
    Category,
    Coupon,
    Event,
    Invoice,
    PushSubscription,
    Review,
    Tag,
    UsefulNumber,
)

def normalize_tag_names(values):
    normalized = []
    for value in values:
        for name in re.split(r"[\s,;#]+", value):
            clean_name = name.strip()
            if clean_name and clean_name not in normalized:
                normalized.append(clean_name[:80])
    return normalized


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "icon", "color", "description", "order")


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name", "slug")


class BusinessImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessImage
        fields = ("id", "image", "alt_text", "order")


class BusinessSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Category.objects.all(),
        allow_null=True,
        required=False,
    )
    category_name = serializers.CharField(source="category.name", read_only=True)
    tags = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True,
    )
    tag_names = serializers.SerializerMethodField(read_only=True)
    full_address = serializers.CharField(read_only=True)
    rating = serializers.FloatField(source="average_rating", read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)
    # A listagem publica nao deve carregar imagens Base64 junto ao JSON.
    # A capa e servida pela rota dedicada e cacheavel.
    image_url = serializers.SerializerMethodField(read_only=True)
    images = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Business
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "services_products",
            "plan_type",
            "public_subdomain",
            "category",
            "category_name",
            "street",
            "number",
            "complement",
            "neighborhood",
            "city",
            "state",
            "postal_code",
            "full_address",
            "phone_whatsapp",
            "email",
            "website",
            "instagram",
            "logo_image",
            "image_url",
            "images",
            "opening_hours",
            "is_featured",
            "status",
            "tags",
            "tag_names",
            "rating",
            "reviews_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("slug", "status", "is_featured", "plan_type", "public_subdomain", "meta_pixel_id", "google_analytics_id", "google_ads_id", "created_at", "updated_at")

    def create(self, validated_data):
        tag_names = validated_data.pop("tags", [])
        validated_data["status"] = Business.Status.PENDING
        business = super().create(validated_data)
        tags = []
        for tag_name in tag_names:
            clean_name = tag_name.strip()
            if clean_name:
                tags.append(Tag.objects.get_or_create(name=clean_name)[0])
        business.tags.set(tags)
        return business

    def validate_tags(self, value):
        return normalize_tag_names(value)

    def get_tag_names(self, obj):
        return [tag.name for tag in obj.tags.all()]

    def get_image_url(self, obj):
        image_url = obj.image_url or ""
        if not image_url.startswith("data:"):
            return image_url
        request = self.context.get("request")
        path = f"/api/businesses/{obj.slug}/cover/"
        return request.build_absolute_uri(path) if request else path

    def get_images(self, obj):
        return []


class BackofficeBusinessSerializer(ManagementValidationMixin, serializers.ModelSerializer):
    category = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Category.objects.all(),
        allow_null=True,
        required=False,
    )
    category_name = serializers.CharField(source="category.name", read_only=True)
    tags = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True,
    )
    tag_names = serializers.SerializerMethodField(read_only=True)
    full_address = serializers.CharField(read_only=True)
    rating = serializers.FloatField(source="average_rating", read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)
    images = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True,
        max_length=10,
    )
    gallery_images = BusinessImageSerializer(source="images", many=True, read_only=True)

    class Meta:
        model = Business
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "services_products",
            "plan_type",
            "public_subdomain",
            "meta_pixel_id",
            "google_analytics_id",
            "google_ads_id",
            "category",
            "category_name",
            "street",
            "number",
            "complement",
            "neighborhood",
            "city",
            "state",
            "postal_code",
            "full_address",
            "phone_whatsapp",
            "email",
            "website",
            "instagram",
            "logo_image",
            "image_url",
            "images",
            "gallery_images",
            "opening_hours",
            "is_featured",
            "status",
            "tags",
            "tag_names",
            "rating",
            "reviews_count",
            "created_at",
            "updated_at",
            "published_at",
        )
        read_only_fields = ("slug", "created_at", "updated_at", "published_at")

    def get_tag_names(self, obj):
        return [tag.name for tag in obj.tags.all()]

    def validate_tags(self, value):
        return normalize_tag_names(value)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        plan_type = attrs.get("plan_type", getattr(self.instance, "plan_type", Business.PlanType.FREE))
        paid_only = ("public_subdomain", "meta_pixel_id", "google_analytics_id", "google_ads_id")
        paid_values = {
            field: attrs.get(field, getattr(self.instance, field, ""))
            for field in paid_only
        }
        if plan_type != Business.PlanType.PAID and any(paid_values.values()):
            raise serializers.ValidationError({"plan_type": "Subdominio e integracoes de marketing sao exclusivos do plano pago."})
        images = attrs.get("images")
        if images is not None:
            limit = 5 if plan_type == Business.PlanType.PAID else 1
            if len(images) > limit:
                raise serializers.ValidationError({"images": f"O plano permite no maximo {limit} imagem(ns)."})
        return attrs

    def validate_public_subdomain(self, value):
        subdomain = value.strip().lower()
        if not subdomain:
            return ""
        if not re.fullmatch(r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?", subdomain):
            raise serializers.ValidationError("Use até 63 letras minúsculas, números ou hífens, sem hífen no início ou fim.")
        if subdomain in {"www", "api", "admin", "backoffice", "mail"}:
            raise serializers.ValidationError("Este subdominio e reservado.")
        queryset = Business.objects.filter(public_subdomain__iexact=subdomain)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Este endereco ja esta em uso por outra empresa.")
        return subdomain

    def create(self, validated_data):
        tag_names = validated_data.pop("tags", [])
        images = validated_data.pop("images", [])
        business = super().create(validated_data)
        self._set_tags(business, tag_names)
        self._set_images(business, images)
        return business

    def update(self, instance, validated_data):
        tag_names = validated_data.pop("tags", None)
        images = validated_data.pop("images", None)
        business = super().update(instance, validated_data)
        if tag_names is not None:
            self._set_tags(business, tag_names)
        if images is not None:
            self._set_images(business, images)
        return business

    def _set_tags(self, business, tag_names):
        tags = []
        for tag_name in tag_names:
            clean_name = tag_name.strip()
            if not clean_name:
                continue
            tag, _ = Tag.objects.get_or_create(name=clean_name)
            tags.append(tag)
        business.tags.set(tags)

    def validate_images(self, value):
        if len(value) > 10:
            raise serializers.ValidationError("Cada estabelecimento pode ter no maximo 10 imagens.")
        return value

    def _set_images(self, business, images):
        business.images.all().delete()
        for index, image in enumerate(images[:10]):
            if image:
                BusinessImage.objects.create(business=business, image=image, order=index)


class ReviewSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source="business.name", read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "business",
            "business_name",
            "author_name",
            "rating",
            "comment",
            "created_at",
        )
        read_only_fields = ("created_at",)

    def create(self, validated_data):
        validated_data["is_approved"] = False
        return super().create(validated_data)


class CouponSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source="business.name", read_only=True)
    business_slug = serializers.CharField(source="business.slug", read_only=True)
    is_valid = serializers.BooleanField(read_only=True)

    class Meta:
        model = Coupon
        fields = (
            "id",
            "business",
            "business_name",
            "business_slug",
            "title",
            "discount_code",
            "description",
            "starts_at",
            "expires_at",
            "is_valid",
        )


class BackofficeCouponSerializer(ManagementValidationMixin, serializers.ModelSerializer):
    business = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Business.objects.all(),
    )
    business_name = serializers.CharField(source="business.name", read_only=True)
    is_valid = serializers.BooleanField(read_only=True)

    class Meta:
        model = Coupon
        fields = (
            "id",
            "business",
            "business_name",
            "title",
            "discount_code",
            "description",
            "starts_at",
            "expires_at",
            "is_active",
            "is_valid",
            "created_at",
        )
        read_only_fields = ("created_at",)

    def validate_business(self, business):
        if business.plan_type != Business.PlanType.PAID:
            raise serializers.ValidationError("Cupons sao um beneficio exclusivo do plano pago.")
        return business


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = (
            "id",
            "title",
            "schedule_text",
            "starts_at",
            "ends_at",
            "location",
            "description",
            "image_url",
        )


class BackofficeEventSerializer(ManagementValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = (
            "id",
            "title",
            "schedule_text",
            "starts_at",
            "ends_at",
            "location",
            "description",
            "image_url",
            "is_published",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class UsefulNumberSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsefulNumber
        fields = ("id", "name", "phone", "description", "category", "order")


class BackofficeUsefulNumberSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsefulNumber
        fields = ("id", "name", "phone", "description", "category", "order", "is_active")


class AdvertiserSerializer(ManagementValidationMixin, serializers.ModelSerializer):
    business_names = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Advertiser
        fields = (
            "id", "user", "businesses", "business_names", "name", "document",
            "contact_name", "email", "phone", "billing_email", "status", "notes",
            "created_at", "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")

    def get_business_names(self, obj):
        return [business.name for business in obj.businesses.all()]


class AdvertisingPlanSerializer(ManagementValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = AdvertisingPlan
        fields = (
            "id", "name", "description", "price", "billing_cycle", "max_ads", "plan_type", "max_images",
            "featured", "includes_coupons", "includes_marketing", "includes_custom_page", "is_active", "created_at", "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class AdvertisingSubscriptionSerializer(ManagementValidationMixin, serializers.ModelSerializer):
    advertiser_name = serializers.CharField(source="advertiser.name", read_only=True)
    business_name = serializers.CharField(source="business.name", read_only=True)
    plan_name = serializers.CharField(source="plan.name", read_only=True)

    class Meta:
        model = AdvertisingSubscription
        fields = (
            "id", "advertiser", "advertiser_name", "business", "business_name", "advertisement",
            "plan", "plan_name", "start_date", "end_date", "next_due_date",
            "agreed_price", "status", "auto_renew", "notes", "created_at", "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class AdvertisementMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdvertisementMedia
        fields = ("id", "media_type", "file_data", "alt_text", "caption", "order")
        read_only_fields = ("id",)


class AdvertisementSerializer(ManagementValidationMixin, serializers.ModelSerializer):
    business_name = serializers.CharField(source="business.name", read_only=True)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=80), required=False, write_only=True
    )
    tag_names = serializers.SerializerMethodField(read_only=True)
    media = AdvertisementMediaSerializer(many=True, required=False)

    class Meta:
        model = Advertisement
        fields = (
            "id", "business", "business_name", "title", "short_description",
            "description", "call_to_action", "destination_url", "logo_image",
            "cover_image", "video_url", "tags", "tag_names", "media", "starts_at",
            "ends_at", "status", "is_featured", "is_primary", "created_at", "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")

    def validate(self, attrs):
        attrs = super().validate(attrs)
        starts_at = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        ends_at = attrs.get("ends_at", getattr(self.instance, "ends_at", None))
        if starts_at and ends_at and ends_at < starts_at:
            raise serializers.ValidationError(
                {"ends_at": "O fim da publicacao deve ser posterior ao inicio."}
            )
        business = attrs.get("business", getattr(self.instance, "business", None))
        media = attrs.get("media")
        if business and media is not None:
            images = [item for item in media if item.get("media_type", "image") == AdvertisementMedia.MediaType.IMAGE]
            limit = 5 if business.plan_type == Business.PlanType.PAID else 1
            if len(images) > limit:
                raise serializers.ValidationError({"media": f"O plano {business.get_plan_type_display().lower()} permite no maximo {limit} imagem(ns)."})
        if business and attrs.get("is_featured", False) and business.plan_type != Business.PlanType.PAID:
            raise serializers.ValidationError({"is_featured": "Destaque e exclusivo para anunciantes pagos."})
        return attrs

    def get_tag_names(self, obj):
        return [tag.name for tag in obj.tags.all()]

    def create(self, validated_data):
        tags = validated_data.pop("tags", [])
        media = validated_data.pop("media", [])
        advertisement = super().create(validated_data)
        self._set_relations(advertisement, tags, media)
        return advertisement

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)
        media = validated_data.pop("media", None)
        advertisement = super().update(instance, validated_data)
        self._set_relations(advertisement, tags, media)
        return advertisement

    def _set_relations(self, advertisement, tag_names, media):
        if tag_names is not None:
            tags = []
            for name in tag_names:
                clean_name = name.strip()
                if clean_name:
                    tags.append(Tag.objects.get_or_create(name=clean_name)[0])
            advertisement.tags.set(tags)
        if media is not None:
            advertisement.media.all().delete()
            for index, item in enumerate(media[:10]):
                item.pop("order", None)
                AdvertisementMedia.objects.create(
                    advertisement=advertisement, order=index, **item
                )
        self._sync_guide_profile(advertisement)

    def _sync_guide_profile(self, advertisement):
        if not advertisement.is_primary or advertisement.status != Advertisement.Status.PUBLISHED:
            return
        business = advertisement.business
        business.description = advertisement.description or advertisement.short_description
        business.logo_image = advertisement.logo_image
        business.image_url = advertisement.cover_image
        business.is_featured = advertisement.is_featured
        if advertisement.status == Advertisement.Status.PUBLISHED:
            business.status = Business.Status.ACTIVE
        business.save()
        business.tags.set(advertisement.tags.all())
        image_values = [
            item.file_data
            for item in advertisement.media.all()
            if item.media_type == AdvertisementMedia.MediaType.IMAGE
        ]
        if image_values:
            business.images.all().delete()
            for index, value in enumerate(image_values):
                BusinessImage.objects.create(business=business, image=value, order=index)


class InvoiceSerializer(ManagementValidationMixin, serializers.ModelSerializer):
    advertiser_name = serializers.CharField(
        source="subscription.advertiser.name", read_only=True
    )
    business_name = serializers.CharField(
        source="subscription.business.name", read_only=True
    )
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Invoice
        fields = (
            "id", "subscription", "advertiser_name", "business_name", "description",
            "reference_month", "due_date", "amount", "discount", "late_fee", "total",
            "status", "paid_at", "payment_method", "external_reference", "notes",
            "created_at", "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class BackofficeNotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = BackofficeNotification
        fields = (
            "id", "kind", "title", "message", "url", "is_read", "created_at"
        )

    def get_is_read(self, obj):
        user = self.context["request"].user
        return obj.read_by.filter(pk=user.pk).exists()


class PushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushSubscription
        fields = ("endpoint", "p256dh", "auth", "user_agent")

    def create(self, validated_data):
        user = self.context["request"].user
        subscription, _ = PushSubscription.objects.update_or_create(
            endpoint=validated_data["endpoint"],
            defaults={**validated_data, "user": user, "is_active": True},
        )
        return subscription
