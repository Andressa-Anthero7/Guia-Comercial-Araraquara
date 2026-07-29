from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import (
    Advertiser,
    AdvertisingPlan,
    AdvertisingSubscription,
    Business,
    Invoice,
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
