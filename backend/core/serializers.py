from rest_framework import serializers

from .models import (
    Advertiser,
    AdvertisingPlan,
    AdvertisingSubscription,
    Business,
    BusinessImage,
    Category,
    Coupon,
    Event,
    Invoice,
    Review,
    Tag,
    UsefulNumber,
)


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
        child=serializers.CharField(max_length=80),
        required=False,
        write_only=True,
    )
    tag_names = serializers.SerializerMethodField(read_only=True)
    full_address = serializers.CharField(read_only=True)
    rating = serializers.FloatField(source="average_rating", read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)
    images = BusinessImageSerializer(many=True, read_only=True)

    class Meta:
        model = Business
        fields = (
            "id",
            "name",
            "slug",
            "description",
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
        read_only_fields = ("slug", "status", "is_featured", "created_at", "updated_at")

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

    def get_tag_names(self, obj):
        return [tag.name for tag in obj.tags.all()]


class BackofficeBusinessSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Category.objects.all(),
        allow_null=True,
        required=False,
    )
    category_name = serializers.CharField(source="category.name", read_only=True)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=80),
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


class BackofficeCouponSerializer(serializers.ModelSerializer):
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


class BackofficeEventSerializer(serializers.ModelSerializer):
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


class AdvertiserSerializer(serializers.ModelSerializer):
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


class AdvertisingPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdvertisingPlan
        fields = (
            "id", "name", "description", "price", "billing_cycle", "max_ads",
            "featured", "is_active", "created_at", "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class AdvertisingSubscriptionSerializer(serializers.ModelSerializer):
    advertiser_name = serializers.CharField(source="advertiser.name", read_only=True)
    business_name = serializers.CharField(source="business.name", read_only=True)
    plan_name = serializers.CharField(source="plan.name", read_only=True)

    class Meta:
        model = AdvertisingSubscription
        fields = (
            "id", "advertiser", "advertiser_name", "business", "business_name",
            "plan", "plan_name", "start_date", "end_date", "next_due_date",
            "agreed_price", "status", "auto_renew", "notes", "created_at", "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")


class InvoiceSerializer(serializers.ModelSerializer):
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
