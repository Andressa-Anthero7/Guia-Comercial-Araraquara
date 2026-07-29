from django.contrib import admin

from .models import Business, BusinessImage, Category, Coupon, Event, Review, Tag, UsefulNumber


admin.site.site_header = "Guia Comercial Araraquara"
admin.site.site_title = "Backoffice Guia Comercial"
admin.site.index_title = "Administracao do portal"


class ReviewInline(admin.TabularInline):
    model = Review
    extra = 0
    fields = ("author_name", "rating", "is_approved", "created_at")
    readonly_fields = ("created_at",)


class CouponInline(admin.TabularInline):
    model = Coupon
    extra = 0
    fields = ("title", "discount_code", "expires_at", "is_active")


class BusinessImageInline(admin.TabularInline):
    model = BusinessImage
    extra = 0
    fields = ("order", "image", "alt_text")
    max_num = 10


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "order", "is_active")
    list_editable = ("order", "is_active")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "city",
        "neighborhood",
        "phone_whatsapp",
        "email",
        "status",
        "is_featured",
        "updated_at",
    )
    list_editable = ("status", "is_featured")
    list_filter = ("status", "is_featured", "category", "city", "neighborhood")
    search_fields = (
        "name",
        "description",
        "street",
        "neighborhood",
        "city",
        "phone_whatsapp",
        "email",
        "instagram",
    )
    prepopulated_fields = {"slug": ("name",)}
    filter_horizontal = ("tags",)
    readonly_fields = (
        "full_address_display",
        "average_rating_display",
        "reviews_count_display",
        "created_at",
        "updated_at",
        "published_at",
    )
    inlines = [BusinessImageInline, ReviewInline, CouponInline]

    fieldsets = (
        (
            "Identificacao",
            {
                "fields": (
                    "name",
                    "slug",
                    "category",
                    "tags",
                    "description",
                    "logo_image",
                    "image_url",
                    "is_featured",
                    "status",
                )
            },
        ),
        (
            "Endereco completo",
            {
                "fields": (
                    "street",
                    "number",
                    "complement",
                    "neighborhood",
                    "city",
                    "state",
                    "postal_code",
                    "full_address_display",
                )
            },
        ),
        (
            "Contato",
            {
                "fields": (
                    "phone_whatsapp",
                    "email",
                    "website",
                    "instagram",
                    "opening_hours",
                )
            },
        ),
        (
            "Indicadores",
            {
                "fields": (
                    "average_rating_display",
                    "reviews_count_display",
                )
            },
        ),
        (
            "Controle",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                    "published_at",
                )
            },
        ),
    )

    @admin.display(description="endereco completo")
    def full_address_display(self, obj):
        if obj is None:
            return "-"
        return obj.full_address

    @admin.display(description="nota media")
    def average_rating_display(self, obj):
        if obj is None:
            return "-"
        return obj.average_rating

    @admin.display(description="avaliacoes aprovadas")
    def reviews_count_display(self, obj):
        if obj is None:
            return "-"
        return obj.reviews_count


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("business", "author_name", "rating", "is_approved", "created_at")
    list_editable = ("is_approved",)
    list_filter = ("is_approved", "rating", "created_at")
    search_fields = ("business__name", "author_name", "author_email", "comment")
    autocomplete_fields = ("business",)
    readonly_fields = ("created_at",)


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("title", "business", "discount_code", "starts_at", "expires_at", "is_active")
    list_editable = ("is_active",)
    list_filter = ("is_active", "starts_at", "expires_at")
    search_fields = ("title", "discount_code", "description", "business__name")
    autocomplete_fields = ("business",)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "schedule_text", "starts_at", "location", "is_published")
    list_editable = ("is_published",)
    list_filter = ("is_published", "starts_at")
    search_fields = ("title", "location", "description")


@admin.register(UsefulNumber)
class UsefulNumberAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "category", "order", "is_active")
    list_editable = ("order", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name", "phone", "description")
