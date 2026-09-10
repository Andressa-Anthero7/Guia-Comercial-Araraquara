from decimal import Decimal
from rest_framework import serializers
from .models import Advertiser, AdvertisingPlan, AdvertisingSubscription, Advertisement, Business, Coupon, Event, Invoice


class ManagementValidationMixin:
    def validate(self, attrs):
        attrs = super().validate(attrs)
        model = self.Meta.model
        def value(name, default=None):
            return attrs.get(name, getattr(self.instance, name, default))
        for field in ("price", "agreed_price", "amount", "discount", "late_fee"):
            if field in attrs and attrs[field] < 0:
                raise serializers.ValidationError({field: "Informe um valor maior ou igual a zero."})
        dates = {Coupon: ("starts_at", "expires_at"), Event: ("starts_at", "ends_at"), AdvertisingSubscription: ("start_date", "end_date")}
        if model in dates:
            start, end = dates[model]
            if value(start) and value(end) and value(end) < value(start):
                raise serializers.ValidationError({end: "O término não pode ser anterior ao início."})
        if model is Advertiser and "user" in attrs:
            previous = getattr(self.instance, "user_id", None)
            selected = attrs["user"]
            if (selected.pk if selected else None) != previous:
                request = self.context.get("request")
                if not request or not request.user.is_superuser:
                    raise serializers.ValidationError({"user": "Somente um superadministrador pode alterar o acesso vinculado."})
                if selected and (selected.is_staff or selected.is_superuser):
                    raise serializers.ValidationError({"user": "Vincule uma conta de anunciante, sem acesso administrativo."})
        if model is AdvertisingSubscription:
            business, advertiser, advertisement = value("business"), value("advertiser"), value("advertisement")
            if advertiser and business and not advertiser.businesses.filter(pk=business.pk).exists():
                raise serializers.ValidationError({"business": "Vincule este estabelecimento ao anunciante antes de contratar."})
            if advertisement and business and advertisement.business_id != business.pk:
                raise serializers.ValidationError({"advertisement": "O anúncio pertence a outro estabelecimento."})
        if model is AdvertisingPlan:
            limit = 5 if value("plan_type", "paid") == "paid" else 1
            if value("max_images", 5) > limit or value("max_images", 5) < 1:
                raise serializers.ValidationError({"max_images": f"Informe entre 1 e {limit} imagens para esta modalidade."})
            if value("max_ads", 1) < 1:
                raise serializers.ValidationError({"max_ads": "O plano deve permitir pelo menos um anúncio."})
        if model is Invoice:
            if value("discount", Decimal(0)) > value("amount", Decimal(0)) + value("late_fee", Decimal(0)):
                raise serializers.ValidationError({"discount": "O desconto não pode superar o valor com os acréscimos."})
            if value("status") == Invoice.Status.PAID:
                if not value("paid_at") or not value("payment_method"):
                    raise serializers.ValidationError({"paid_at": "Para registrar o pagamento, informe a data e a forma de pagamento."})
            elif value("paid_at"):
                raise serializers.ValidationError({"paid_at": "Remova a data de pagamento ao reabrir ou cancelar a cobrança."})
        if model is Business:
            if value("plan_type", "free") == "free":
                if value("is_featured", False):
                    raise serializers.ValidationError({"is_featured": "Destaque é um benefício do plano pago."})
                if self.instance and "images" not in attrs and self.instance.images.count() > 1:
                    raise serializers.ValidationError({"images": "Remova as imagens extras antes de mudar para gratuito (limite de uma imagem)."})
        if model is Advertisement:
            business = value("business")
            if business and value("is_primary", True):
                other = Advertisement.objects.filter(business=business, is_primary=True)
                if self.instance:
                    other = other.exclude(pk=self.instance.pk)
                if other.exists():
                    raise serializers.ValidationError({"is_primary": "Este estabelecimento já possui um anúncio principal. Edite o existente ou desmarque esta opção."})
            if "media" in attrs and len(attrs["media"]) > 10:
                raise serializers.ValidationError({"media": "O limite é de dez mídias por anúncio."})
        return attrs
