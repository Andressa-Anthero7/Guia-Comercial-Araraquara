from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
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


class Advertiser(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Ativo"
        INACTIVE = "inactive", "Inativo"
        PROSPECT = "prospect", "Prospect"

    user = models.OneToOneField(
        get_user_model(),
        verbose_name="usuario de acesso",
        related_name="advertiser_profile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    businesses = models.ManyToManyField(
        Business,
        verbose_name="anuncios",
        related_name="advertisers",
        blank=True,
    )
    name = models.CharField("nome/razao social", max_length=180)
    document = models.CharField("CPF/CNPJ", max_length=24, blank=True)
    contact_name = models.CharField("responsavel", max_length=140, blank=True)
    email = models.EmailField("e-mail", blank=True)
    phone = models.CharField("telefone/WhatsApp", max_length=30, blank=True)
    billing_email = models.EmailField("e-mail financeiro", blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    notes = models.TextField("observacoes", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name",)
        verbose_name = "anunciante"
        verbose_name_plural = "anunciantes"

    def __str__(self):
        return self.name


class AdvertisingPlan(models.Model):
    class BillingCycle(models.TextChoices):
        MONTHLY = "monthly", "Mensal"
        QUARTERLY = "quarterly", "Trimestral"
        SEMIANNUAL = "semiannual", "Semestral"
        ANNUAL = "annual", "Anual"

    name = models.CharField("nome", max_length=120)
    description = models.TextField("descricao", blank=True)
    price = models.DecimalField("valor", max_digits=10, decimal_places=2)
    billing_cycle = models.CharField(
        "ciclo", max_length=20, choices=BillingCycle.choices, default=BillingCycle.MONTHLY
    )
    max_ads = models.PositiveSmallIntegerField("limite de anuncios", default=1)
    featured = models.BooleanField("inclui destaque", default=False)
    is_active = models.BooleanField("ativo", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("price", "name")
        verbose_name = "plano de publicidade"
        verbose_name_plural = "planos de publicidade"

    def __str__(self):
        return self.name


class Advertisement(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Rascunho"
        REVIEW = "review", "Em revisao"
        PUBLISHED = "published", "Publicado"
        PAUSED = "paused", "Pausado"
        ENDED = "ended", "Encerrado"

    business = models.ForeignKey(
        Business,
        verbose_name="estabelecimento",
        related_name="advertisements",
        on_delete=models.CASCADE,
    )
    title = models.CharField("titulo", max_length=180)
    short_description = models.CharField("chamada curta", max_length=240, blank=True)
    description = models.TextField("texto do anuncio", blank=True)
    call_to_action = models.CharField("chamada para acao", max_length=80, blank=True)
    destination_url = models.URLField("link de destino", blank=True)
    logo_image = models.TextField("logomarca", blank=True)
    cover_image = models.TextField("imagem de capa", blank=True)
    video_url = models.URLField("video", blank=True)
    tags = models.ManyToManyField(Tag, related_name="advertisements", blank=True)
    starts_at = models.DateField("inicio da publicacao", null=True, blank=True)
    ends_at = models.DateField("fim da publicacao", null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    is_featured = models.BooleanField("destaque", default=False)
    is_primary = models.BooleanField("anuncio principal", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-is_primary", "-updated_at")
        verbose_name = "anuncio"
        verbose_name_plural = "anuncios"
        constraints = [
            models.UniqueConstraint(
                fields=("business",),
                condition=models.Q(is_primary=True),
                name="one_primary_advertisement_per_business",
            )
        ]

    def __str__(self):
        return f"{self.business} - {self.title}"


class AdvertisementMedia(models.Model):
    class MediaType(models.TextChoices):
        IMAGE = "image", "Imagem"
        VIDEO = "video", "Video"

    advertisement = models.ForeignKey(
        Advertisement, related_name="media", on_delete=models.CASCADE
    )
    media_type = models.CharField(max_length=10, choices=MediaType.choices, default=MediaType.IMAGE)
    file_data = models.TextField("arquivo/URL")
    alt_text = models.CharField("texto alternativo", max_length=180, blank=True)
    caption = models.CharField("legenda", max_length=240, blank=True)
    order = models.PositiveSmallIntegerField("ordem", default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("order", "id")
        verbose_name = "midia do anuncio"
        verbose_name_plural = "midias do anuncio"


class AdvertisingSubscription(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Ativa"
        PENDING = "pending", "Pendente"
        SUSPENDED = "suspended", "Suspensa"
        CANCELLED = "cancelled", "Cancelada"
        EXPIRED = "expired", "Vencida"

    advertiser = models.ForeignKey(
        Advertiser, related_name="subscriptions", on_delete=models.PROTECT
    )
    business = models.ForeignKey(
        Business, verbose_name="anuncio", related_name="subscriptions", on_delete=models.PROTECT
    )
    advertisement = models.ForeignKey(
        Advertisement,
        verbose_name="campanha/anuncio",
        related_name="subscriptions",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    plan = models.ForeignKey(
        AdvertisingPlan, related_name="subscriptions", on_delete=models.PROTECT
    )
    start_date = models.DateField("inicio")
    end_date = models.DateField("termino", null=True, blank=True)
    next_due_date = models.DateField("proximo vencimento")
    agreed_price = models.DecimalField("valor contratado", max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    auto_renew = models.BooleanField("renovacao automatica", default=True)
    notes = models.TextField("observacoes", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("next_due_date", "-created_at")
        verbose_name = "assinatura de anuncio"
        verbose_name_plural = "assinaturas de anuncios"

    def __str__(self):
        return f"{self.advertiser} - {self.business}"


class Invoice(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Em aberto"
        PAID = "paid", "Paga"
        OVERDUE = "overdue", "Vencida"
        CANCELLED = "cancelled", "Cancelada"

    class PaymentMethod(models.TextChoices):
        PIX = "pix", "PIX"
        BOLETO = "boleto", "Boleto"
        CARD = "card", "Cartao"
        TRANSFER = "transfer", "Transferencia"
        CASH = "cash", "Dinheiro"
        OTHER = "other", "Outro"

    subscription = models.ForeignKey(
        AdvertisingSubscription, related_name="invoices", on_delete=models.CASCADE
    )
    description = models.CharField("descricao", max_length=180, blank=True)
    reference_month = models.DateField("competencia")
    due_date = models.DateField("vencimento")
    amount = models.DecimalField("valor", max_digits=10, decimal_places=2)
    discount = models.DecimalField("desconto", max_digits=10, decimal_places=2, default=0)
    late_fee = models.DecimalField("multa/juros", max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    paid_at = models.DateField("pago em", null=True, blank=True)
    payment_method = models.CharField(
        "forma de pagamento", max_length=20, choices=PaymentMethod.choices, blank=True
    )
    external_reference = models.CharField("referencia externa", max_length=120, blank=True)
    notes = models.TextField("observacoes", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("due_date", "-created_at")
        verbose_name = "cobranca"
        verbose_name_plural = "cobrancas"

    @property
    def total(self):
        return self.amount - self.discount + self.late_fee

    def __str__(self):
        return f"{self.subscription} - {self.due_date}"


class BackofficeNotification(models.Model):
    class Kind(models.TextChoices):
        REGISTRATION = "registration", "Novo cadastro"
        ADVERTISEMENT = "advertisement", "Anuncio"
        REVIEW = "review", "Avaliacao"
        FINANCE = "finance", "Financeiro"
        SYSTEM = "system", "Sistema"

    kind = models.CharField(max_length=24, choices=Kind.choices, default=Kind.SYSTEM)
    title = models.CharField(max_length=160)
    message = models.CharField(max_length=320)
    url = models.CharField(max_length=240, default="/backoffice", blank=True)
    unique_key = models.CharField(max_length=180, unique=True)
    recipient = models.ForeignKey(
        get_user_model(),
        related_name="backoffice_notifications",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    read_by = models.ManyToManyField(
        get_user_model(),
        related_name="read_backoffice_notifications",
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "notificacao do backoffice"
        verbose_name_plural = "notificacoes do backoffice"


class PushSubscription(models.Model):
    user = models.ForeignKey(
        get_user_model(), related_name="push_subscriptions", on_delete=models.CASCADE
    )
    endpoint = models.TextField(unique=True)
    p256dh = models.TextField()
    auth = models.TextField()
    user_agent = models.CharField(max_length=320, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "inscricao push"
        verbose_name_plural = "inscricoes push"


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
