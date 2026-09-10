"""Staff management resources and safe, atomic administrative writes."""
from django.contrib.auth import get_user_model, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction, IntegrityError
from django.db.models.deletion import ProtectedError
from rest_framework import serializers, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAdminUser, SAFE_METHODS

from .models import Category, Tag, Review


class ManagedWritesMixin:
    def _write(self, method, *args, **kwargs):
        try:
            with transaction.atomic():
                return method(*args, **kwargs)
        except ProtectedError:
            raise ValidationError({"detail": "Este cadastro possui vínculos financeiros. Desative ou cancele o cadastro para preservar o histórico."})
        except IntegrityError:
            raise ValidationError({"detail": "Já existe um cadastro com este identificador ou vínculo. Atualize a lista e confira os dados."})

    def create(self, *args, **kwargs):
        return self._write(super().create, *args, **kwargs)

    def update(self, *args, **kwargs):
        return self._write(super().update, *args, **kwargs)

    def destroy(self, *args, **kwargs):
        return self._write(super().destroy, *args, **kwargs)


class ManagedCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description", "icon", "color", "order", "is_active")


class ManagedTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name", "slug")


class ManagedReviewSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source="business.name", read_only=True)

    class Meta:
        model = Review
        fields = ("id", "business", "business_name", "author_name", "author_email", "rating", "comment", "is_approved", "created_at")
        read_only_fields = ("created_at",)


class ManagedCategoryViewSet(ManagedWritesMixin, viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = ManagedCategorySerializer
    queryset = Category.objects.all()


class ManagedTagViewSet(ManagedWritesMixin, viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = ManagedTagSerializer
    queryset = Tag.objects.all()


class ManagedReviewViewSet(ManagedWritesMixin, viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = ManagedReviewSerializer
    queryset = Review.objects.select_related("business").all()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, trim_whitespace=False)

    class Meta:
        model = get_user_model()
        fields = ("id", "username", "first_name", "last_name", "email", "is_active", "is_staff", "is_superuser", "password", "last_login", "date_joined")
        read_only_fields = ("is_superuser", "last_login", "date_joined")

    def validate(self, attrs):
        if not self.instance and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Informe uma senha para criar o acesso."})
        if self.instance and self.instance.is_superuser:
            raise serializers.ValidationError({"detail": "Contas de superadministrador são protegidas. Use a administração do servidor para alterá-las."})
        password = attrs.get("password")
        if password:
            candidate = get_user_model()(**{key: attrs.get(key, getattr(self.instance, key, "")) for key in ("username", "email", "first_name", "last_name")})
            try:
                password_validation.validate_password(password, candidate)
            except DjangoValidationError as exc:
                raise serializers.ValidationError({"password": exc.messages})
        return attrs

    def create(self, validated_data):
        return get_user_model().objects.create_user(**validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save(update_fields=["password"])
        return instance


class ManageAccountsPermission(IsAdminUser):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and (request.method in SAFE_METHODS or request.user.is_superuser)


class ManagedUserViewSet(ManagedWritesMixin, viewsets.ModelViewSet):
    permission_classes = [ManageAccountsPermission]
    serializer_class = UserSerializer
    queryset = get_user_model().objects.order_by("username")
    # Deactivation preserves ownership, billing history and attribution.
    http_method_names = ["get", "post", "patch", "put", "head", "options"]
