from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import (
    Advertiser,
    AdvertisingPlan,
    AdvertisingSubscription,
    Advertisement,
    BackofficeNotification,
    Business,
    Invoice,
    PushSubscription,
)


class FinanceApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="finance-admin",
            password="test-password",
            email="finance@example.com",
            first_name="Financeiro",
            is_staff=True,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.business = Business.objects.create(
            name="Anuncio Teste",
            street="Rua Teste",
            number="10",
            phone_whatsapp="16999999999",
        )
        self.advertiser = Advertiser.objects.create(
            name="Anunciante Teste",
            email="anunciante@example.com",
        )
        self.advertiser.businesses.add(self.business)
        self.plan = AdvertisingPlan.objects.create(
            name="Plano Profissional",
            price=Decimal("199.90"),
        )
        self.subscription = AdvertisingSubscription.objects.create(
            advertiser=self.advertiser,
            business=self.business,
            plan=self.plan,
            start_date=date.today(),
            next_due_date=date.today() + timedelta(days=5),
            agreed_price=Decimal("179.90"),
        )

    def test_finance_resources_require_admin(self):
        anonymous = APIClient()
        response = anonymous.get("/api/backoffice/advertisers/")
        self.assertIn(response.status_code, (401, 403))

    def test_advertiser_is_linked_to_business(self):
        response = self.client.get("/api/backoffice/advertisers/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["business_names"], ["Anuncio Teste"])

    def test_summary_reports_overdue_and_received_amounts(self):
        Invoice.objects.create(
            subscription=self.subscription,
            reference_month=date.today().replace(day=1),
            due_date=date.today() - timedelta(days=2),
            amount=Decimal("179.90"),
        )
        Invoice.objects.create(
            subscription=self.subscription,
            reference_month=date.today().replace(day=1),
            due_date=date.today(),
            amount=Decimal("199.90"),
            discount=Decimal("20.00"),
            status=Invoice.Status.PAID,
            paid_at=date.today(),
            payment_method=Invoice.PaymentMethod.PIX,
        )

        response = self.client.get("/api/backoffice/finance-summary/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["overdue_count"], 1)
        self.assertEqual(Decimal(response.data["overdue_amount"]), Decimal("179.90"))
        self.assertEqual(
            Decimal(response.data["received_this_month"]), Decimal("179.90")
        )

    def test_session_identifies_logged_user(self):
        response = self.client.get("/api/auth/session/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "finance-admin")
        self.assertEqual(response.data["name"], "Financeiro")

    def test_primary_advertisement_updates_public_guide_profile(self):
        response = self.client.post(
            "/api/backoffice/advertisements/",
            {
                "business": self.business.id,
                "title": "Oferta principal",
                "short_description": "Atendimento especializado",
                "description": "Texto completo exibido no guia comercial.",
                "call_to_action": "Fale conosco",
                "destination_url": "https://example.com/contato",
                "logo_image": "data:image/webp;base64,logo",
                "cover_image": "data:image/webp;base64,capa",
                "video_url": "https://www.youtube.com/watch?v=example",
                "tags": ["Servico local", "Araraquara"],
                "media": [
                    {
                        "media_type": "image",
                        "file_data": "data:image/webp;base64,foto",
                        "alt_text": "Fachada",
                        "caption": "Nossa unidade",
                        "order": 0,
                    }
                ],
                "starts_at": date.today(),
                "status": Advertisement.Status.PUBLISHED,
                "is_featured": True,
                "is_primary": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.business.refresh_from_db()
        self.assertEqual(
            self.business.description, "Texto completo exibido no guia comercial."
        )
        self.assertEqual(self.business.status, Business.Status.ACTIVE)
        self.assertTrue(self.business.is_featured)
        self.assertEqual(self.business.images.count(), 1)
        self.assertEqual(
            set(self.business.tags.values_list("name", flat=True)),
            {"Servico local", "Araraquara"},
        )

    def test_pending_business_creates_backoffice_notification(self):
        notification = BackofficeNotification.objects.get(
            unique_key=f"business-pending-{self.business.pk}"
        )
        self.assertEqual(notification.kind, BackofficeNotification.Kind.REGISTRATION)

        response = self.client.get("/api/backoffice/notifications/")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data[0]["is_read"])

        read_response = self.client.post(
            f"/api/backoffice/notifications/{notification.pk}/read/"
        )
        self.assertEqual(read_response.status_code, 200)
        self.assertTrue(notification.read_by.filter(pk=self.user.pk).exists())

    def test_backoffice_business_accepts_space_separated_hashtags(self):
        response = self.client.post(
            "/api/backoffice/businesses/",
            {
                "name": "Sorveteria Teste",
                "description": "Cadastro com hashtags comerciais.",
                "street": "Rua Teste",
                "number": "20",
                "neighborhood": "Centro",
                "city": "Araraquara",
                "state": "SP",
                "phone_whatsapp": "16999999999",
                "email": "sorveteria@example.com",
                "tags": ["#SorveteAraraquara #SobremesaPerfeita #VemPraLoja"],
                "status": "pending",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(
            set(Business.objects.get(pk=response.data["id"]).tags.values_list("name", flat=True)),
            {"SorveteAraraquara", "SobremesaPerfeita", "VemPraLoja"},
        )

    def test_staff_user_can_register_push_subscription(self):
        response = self.client.post(
            "/api/backoffice/push/subscription/",
            {
                "endpoint": "https://push.example.com/subscription/123",
                "p256dh": "public-client-key",
                "auth": "authentication-secret",
                "user_agent": "Test Browser",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(
            PushSubscription.objects.filter(user=self.user, is_active=True).exists()
        )
