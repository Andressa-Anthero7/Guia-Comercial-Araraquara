from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


def make_unique_slug(instance, value):
    base_slug = slugify(value) or "item"
    slug = base_slug
    counter = 2
    model_class = instance.__class__

    while model_class.objects.filter(slug=slug).exclude(pk=instance.pk).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug


class Category(models.Model):
    name = models.CharField("nome", max_length=120)
    slug = models.SlugField("slug", max_length=140, unique=True, blank=True)
    icon = models.CharField("icone", max_length=80, blank=True)
    color = models.CharField("cor", max_length=120, blank=True)
    description = models.TextField("descricao", blank=True)
    order = models.PositiveIntegerField("ordem", default=0)
    is_active = models.BooleanField("ativo", default=True)
    created_at = models.DateTimeField("criado em", auto_now_add=True)
    updated_at = models.DateTimeField("atualizado em", auto_now=True)

    class Meta:
        verbose_name = "categoria"
        verbose_name_plural = "categorias"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = make_unique_slug(self, self.name)
        super().save(*args, **kwargs)


class Tag(models.Model):
    name = models.CharField("nome", max_length=80, unique=True)
    slug = models.SlugField("slug", max_length=100, unique=True, blank=True)

    class Meta:
        verbose_name = "tag"
        verbose_name_plural = "tags"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = make_unique_slug(self, self.name)
        super().save(*args, **kwargs)


class Business(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Rascunho"
        PENDING = "pending", "Pendente"
        ACTIVE = "active", "Publicado"
        INACTIVE = "inactive", "Inativo"

    category = models.ForeignKey(
        Category,
        verbose_name="categoria",
        related_name="businesses",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    tags = models.ManyToManyField(Tag, verbose_name="tags", related_name="businesses", blank=True)

    name = models.CharField("nome do estabelecimento", max_length=160)
    slug = models.SlugField("slug", max_length=180, unique=True, blank=True)
    description = models.TextField("descricao", blank=True)

    street = models.CharField("rua", max_length=180)
    number = models.CharField("numero", max_length=20)
    complement = models.CharField("complemento", max_length=120, blank=True)
    neighborhood = models.CharField("bairro", max_length=120, blank=True)
    city = models.CharField("cidade", max_length=100, default="Araraquara")
    state = models.CharField("UF", max_length=2, default="SP")
    postal_code = models.CharField("CEP", max_length=10, blank=True)

    phone_whatsapp = models.CharField("fone/whatsapp", max_length=30)
    email = models.EmailField("e-mail", blank=True)
    website = models.URLField("site", blank=True)
    instagram = models.CharField("instagram", max_length=80, blank=True)

    logo_image = models.TextField("logomarca", blank=True)
    image_url = models.TextField("imagem de capa", blank=True)
    opening_hours = models.CharField("horario de funcionamento", max_length=180, blank=True)
    is_featured = models.BooleanField("destaque", default=False)
    status = models.CharField("status", max_length=20, choices=Status.choices, default=Status.PENDING)

    created_at = models.DateTimeField("criado em", auto_now_add=True)
    updated_at = models.DateTimeField("atualizado em", auto_now=True)
    published_at = models.DateTimeField("publicado em", null=True, blank=True)

    class Meta:
        verbose_name = "estabelecimento"
        verbose_name_plural = "estabelecimentos"
        ordering = ["-is_featured", "name"]
        indexes = [
            models.Index(fields=["status", "is_featured"]),
            models.Index(fields=["city", "neighborhood"]),
        ]

    def __str__(self):
        return self.name

    @property
    def full_address(self):
        parts = [f"{self.street}, {self.number}"]
        if self.complement:
            parts.append(self.complement)
        if self.neighborhood:
            parts.append(self.neighborhood)
        parts.append(f"{self.city}/{self.state}")
        if self.postal_code:
            parts.append(f"CEP {self.postal_code}")
        return " - ".join(parts)

    @property
    def average_rating(self):
        approved_reviews = self.reviews.filter(is_approved=True)
        if not approved_reviews.exists():
            return 0
        total = sum(review.rating for review in approved_reviews)
        return round(total / approved_reviews.count(), 1)

    @property
    def reviews_count(self):
        return self.reviews.filter(is_approved=True).count()

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = make_unique_slug(self, self.name)

        if self.status == self.Status.ACTIVE and self.published_at is None:
            self.published_at = timezone.now()

        super().save(*args, **kwargs)


class BusinessImage(models.Model):
    business = models.ForeignKey(
        Business,
        verbose_name="estabelecimento",
        related_name="images",
        on_delete=models.CASCADE,
    )
    image = models.TextField("imagem")
    alt_text = models.CharField("texto alternativo", max_length=160, blank=True)
    order = models.PositiveSmallIntegerField("ordem", default=0)
    created_at = models.DateTimeField("criado em", auto_now_add=True)

    class Meta:
        verbose_name = "imagem do estabelecimento"
        verbose_name_plural = "imagens do estabelecimento"
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.business} - imagem {self.order + 1}"

    def clean(self):
        super().clean()
        queryset = BusinessImage.objects.filter(business=self.business)
        if self.pk:
            queryset = queryset.exclude(pk=self.pk)
        if queryset.count() >= 10:
            raise ValidationError("Cada estabelecimento pode ter no maximo 10 imagens.")


class Review(models.Model):
    business = models.ForeignKey(
        Business,
        verbose_name="estabelecimento",
        related_name="reviews",
        on_delete=models.CASCADE,
    )
    author_name = models.CharField("nome do avaliador", max_length=120)
    author_email = models.EmailField("e-mail do avaliador", blank=True)
    rating = models.PositiveSmallIntegerField(
        "nota",
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    comment = models.TextField("comentario")
    is_approved = models.BooleanField("aprovado", default=False)
    created_at = models.DateTimeField("criado em", auto_now_add=True)

    class Meta:
        verbose_name = "avaliacao"
        verbose_name_plural = "avaliacoes"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.business} - {self.rating} estrelas"


class Coupon(models.Model):
    business = models.ForeignKey(
        Business,
        verbose_name="estabelecimento",
        related_name="coupons",
        on_delete=models.CASCADE,
    )
    title = models.CharField("titulo", max_length=120)
    discount_code = models.CharField("codigo do cupom", max_length=40)
    description = models.TextField("descricao")
    starts_at = models.DateField("inicio", null=True, blank=True)
    expires_at = models.DateField("validade", null=True, blank=True)
    is_active = models.BooleanField("ativo", default=True)
    created_at = models.DateTimeField("criado em", auto_now_add=True)

    class Meta:
        verbose_name = "cupom"
        verbose_name_plural = "cupons"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.discount_code} - {self.business}"

    @property
    def is_valid(self):
        today = timezone.localdate()
        starts_ok = self.starts_at is None or self.starts_at <= today
        expires_ok = self.expires_at is None or self.expires_at >= today
        return self.is_active and starts_ok and expires_ok


class Event(models.Model):
    title = models.CharField("titulo", max_length=160)
    schedule_text = models.CharField("data/horario exibido", max_length=160, blank=True)
    starts_at = models.DateTimeField("inicio", null=True, blank=True)
    ends_at = models.DateTimeField("fim", null=True, blank=True)
    location = models.CharField("local", max_length=180)
    description = models.TextField("descricao")
    image_url = models.URLField("imagem", blank=True)
    is_published = models.BooleanField("publicado", default=True)
    created_at = models.DateTimeField("criado em", auto_now_add=True)
    updated_at = models.DateTimeField("atualizado em", auto_now=True)

    class Meta:
        verbose_name = "evento"
        verbose_name_plural = "eventos"
        ordering = ["starts_at", "title"]

    def __str__(self):
        return self.title


class UsefulNumber(models.Model):
    class Category(models.TextChoices):
        EMERGENCY = "emergency", "Emergencia"
        SERVICE = "service", "Servico"

    name = models.CharField("nome", max_length=120)
    phone = models.CharField("telefone", max_length=30)
    description = models.TextField("descricao", blank=True)
    category = models.CharField("categoria", max_length=20, choices=Category.choices)
    order = models.PositiveIntegerField("ordem", default=0)
    is_active = models.BooleanField("ativo", default=True)

    class Meta:
        verbose_name = "telefone util"
        verbose_name_plural = "telefones uteis"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name
