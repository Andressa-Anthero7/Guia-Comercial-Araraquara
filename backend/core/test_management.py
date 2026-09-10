from datetime import date, timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import (Advertiser, AdvertisingPlan, AdvertisingSubscription, Business,
                     BusinessImage, Category, Coupon, Event, Invoice, Review, Tag)


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class ManagementTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        users = get_user_model()
        cls.staff = users.objects.create_user("manager", password="test-pass", is_staff=True)
        cls.superuser = users.objects.create_superuser("owner", password="test-pass")
        cls.customer = users.objects.create_user("customer", password="test-pass")
        cls.category = Category.objects.create(name="Alimentação", slug="alimentacao")
        cls.business = Business.objects.create(name="Empresa paga", category=cls.category, street="Rua Um", number="1", phone_whatsapp="16999999999", plan_type="paid", public_subdomain="empresa-paga", status="active", is_featured=True, services_products="Serviços preservados", meta_pixel_id="123456", google_analytics_id="G-TEST", google_ads_id="AW-TEST")
        BusinessImage.objects.create(business=cls.business, image="https://example.test/image.webp")
        cls.advertiser = Advertiser.objects.create(name="Responsável", user=cls.customer)
        cls.advertiser.businesses.add(cls.business)
        cls.plan = AdvertisingPlan.objects.create(name="Profissional", price="99.90")
        cls.subscription = AdvertisingSubscription.objects.create(advertiser=cls.advertiser, business=cls.business, plan=cls.plan, agreed_price="99.90", start_date=date.today(), next_due_date=date.today())
        cls.invoice = Invoice.objects.create(subscription=cls.subscription, amount="99.90", reference_month=date.today(), due_date=date.today())

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.staff)

    def test_all_management_resources_require_staff(self):
        for user in (None, self.customer):
            self.client.force_authenticate(user)
            for resource in ("categories", "tags", "reviews", "users", "businesses", "advertisers", "plans", "subscriptions", "invoices", "advertisements", "coupons", "events", "useful-numbers"):
                with self.subTest(user=user, resource=resource):
                    self.assertIn(self.client.get(f"/api/backoffice/{resource}/").status_code, (401, 403))

    def test_category_creation_edit_and_hiding_reach_public_catalog(self):
        response = self.client.post("/api/backoffice/categories/", {"name": "Educação", "is_active": True}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        identifier = response.data["id"]
        response = self.client.patch(f"/api/backoffice/categories/{identifier}/", {"name": "Cursos", "is_active": False}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertNotIn(identifier, [item["id"] for item in self.client.get("/api/categories/").data])
        self.assertIn(identifier, [item["id"] for item in self.client.get("/api/backoffice/categories/").data])
        self.assertEqual(self.client.delete(f"/api/backoffice/categories/{identifier}/").status_code, 204)

    def test_tag_edit_preserves_relationship(self):
        tag = Tag.objects.create(name="Antiga")
        self.business.tags.add(tag)
        response = self.client.patch(f"/api/backoffice/tags/{tag.pk}/", {"name": "Nova"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.business.tags.get().name, "Nova")

    def test_review_approval_and_withdrawal_change_public_visibility(self):
        review = Review.objects.create(business=self.business, author_name="Visitante", rating=4, comment="Muito bom")
        path = f"/api/backoffice/reviews/{review.pk}/"
        self.assertEqual(self.client.get("/api/reviews/").data, [])
        self.assertEqual(self.client.patch(path, {"is_approved": True}, format="json").status_code, 200)
        self.assertEqual(self.client.get("/api/reviews/").data[0]["id"], review.pk)
        self.client.patch(path, {"is_approved": False}, format="json")
        self.assertEqual(self.client.get("/api/reviews/").data, [])

    def test_edit_preserves_premium_settings_services_and_gallery_ids(self):
        image_id = self.business.images.get().pk
        response = self.client.patch(f"/api/backoffice/businesses/{self.business.slug}/", {"name": "Novo nome"}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.business.refresh_from_db()
        self.assertEqual(self.business.plan_type, "paid")
        self.assertEqual(self.business.public_subdomain, "empresa-paga")
        self.assertEqual(self.business.services_products, "Serviços preservados")
        self.assertEqual(self.business.meta_pixel_id, "123456")
        self.assertEqual(self.business.google_analytics_id, "G-TEST")
        self.assertTrue(self.business.is_featured)
        self.assertEqual(self.business.images.get().pk, image_id)

    def test_upgrade_without_email_exposes_new_subdomain_in_public_api(self):
        business = Business.objects.create(name="Espetinhos", street="Rua", number="2", phone_whatsapp="16999999999", status="active")
        response = self.client.patch(f"/api/backoffice/businesses/{business.slug}/", {"plan_type": "paid", "public_subdomain": "m-espetinhos"}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        public = self.client.get(f"/api/businesses/{business.slug}/").data
        self.assertEqual(public["public_subdomain"], "m-espetinhos")
        self.assertEqual(public["email"], "")

    def test_invalid_dns_labels_are_rejected(self):
        for value in ("www", "name_bad", "-name", "name-", "a" * 64, "name.example"):
            with self.subTest(value=value):
                response = self.client.patch(f"/api/backoffice/businesses/{self.business.slug}/", {"public_subdomain": value}, format="json")
                self.assertEqual(response.status_code, 400, response.data)

    def test_downgrade_requires_explicit_removal_of_premium_settings_and_extra_images(self):
        path = f"/api/backoffice/businesses/{self.business.slug}/"
        self.assertEqual(self.client.patch(path, {"plan_type": "free"}, format="json").status_code, 400)
        BusinessImage.objects.create(business=self.business, image="second")
        data = {"plan_type": "free", "is_featured": False, "public_subdomain": "", "meta_pixel_id": "", "google_analytics_id": "", "google_ads_id": ""}
        self.assertEqual(self.client.patch(path, data, format="json").status_code, 400)
        self.assertEqual(self.client.patch(path, {**data, "images": ["kept"]}, format="json").status_code, 200)
        self.business.refresh_from_db()
        self.assertEqual(self.business.images.count(), 1)
        self.assertEqual(self.business.plan_type, "free")

    def test_failed_gallery_write_rolls_back_entire_edit(self):
        with patch("core.serializers.BusinessImage.objects.create", side_effect=IntegrityError("simulated failure")):
            response = self.client.patch(f"/api/backoffice/businesses/{self.business.slug}/", {"name": "Should roll back", "images": ["new-image"]}, format="json")
        self.assertEqual(response.status_code, 400)
        self.business.refresh_from_db()
        self.assertEqual(self.business.name, "Empresa paga")
        self.assertEqual(self.business.images.get().image, "https://example.test/image.webp")

    def test_financial_relationships_block_destructive_deletes(self):
        self.assertEqual(self.client.delete(f"/api/backoffice/businesses/{self.business.slug}/").status_code, 400)
        self.assertEqual(self.client.delete(f"/api/backoffice/advertisers/{self.advertiser.pk}/").status_code, 400)
        self.assertTrue(Invoice.objects.filter(pk=self.invoice.pk).exists())

    def test_invoice_payment_edit_and_reopen(self):
        path = f"/api/backoffice/invoices/{self.invoice.pk}/"
        self.assertEqual(self.client.patch(path, {"discount": "1000.00"}, format="json").status_code, 400)
        self.assertEqual(self.client.patch(path, {"status": "paid"}, format="json").status_code, 400)
        paid = self.client.patch(path, {"status": "paid", "paid_at": str(date.today()), "payment_method": "pix", "discount": "9.90"}, format="json")
        self.assertEqual(paid.status_code, 200, paid.data)
        self.assertEqual(paid.data["total"], "90.00")
        self.assertEqual(self.client.patch(path, {"status": "open"}, format="json").status_code, 400)
        self.assertEqual(self.client.patch(path, {"status": "open", "paid_at": None}, format="json").status_code, 200)

    def test_finance_dates_values_and_ownership_are_validated(self):
        other = Business.objects.create(name="Outra empresa", street="Rua", number="2", phone_whatsapp="16999999999")
        path = f"/api/backoffice/subscriptions/{self.subscription.pk}/"
        for change in ({"business": other.pk}, {"agreed_price": "-1"}, {"end_date": str(date.today() - timedelta(days=1))}):
            self.assertEqual(self.client.patch(path, change, format="json").status_code, 400)
        self.assertEqual(self.client.patch(f"/api/backoffice/plans/{self.plan.pk}/", {"price": "-10"}, format="json").status_code, 400)

    def test_content_date_ranges_are_validated(self):
        for resource, data, error_field in (("events", {"title": "Evento", "description": "Evento teste", "location": "Centro", "starts_at": "2026-09-10T12:00:00Z", "ends_at": "2026-09-09T12:00:00Z"}, "ends_at"), ("coupons", {"business": self.business.slug, "title": "Cupom", "description": "Desconto", "discount_code": "PROMO", "starts_at": "2026-09-10", "expires_at": "2026-09-09"}, "expires_at")):
            response = self.client.post(f"/api/backoffice/{resource}/", data, format="json")
            self.assertEqual(response.status_code, 400)
            self.assertIn(error_field, response.data)

    def test_content_creation_edit_and_removal(self):
        for resource, data, change in (
            ("events", {"title": "Evento", "description": "Evento teste", "location": "Centro", "is_published": True}, {"is_published": False}),
            ("coupons", {"business": self.business.slug, "title": "Cupom", "description": "Desconto", "discount_code": "PROMO", "is_active": True}, {"is_active": False}),
            ("useful-numbers", {"name": "Emergência", "phone": "190", "category": "emergency", "is_active": True}, {"is_active": False}),
        ):
            response = self.client.post(f"/api/backoffice/{resource}/", data, format="json")
            self.assertEqual(response.status_code, 201, response.data)
            identifier = response.data["id"]
            path = f"/api/backoffice/{resource}/{identifier}/"
            self.assertEqual(self.client.patch(path, change, format="json").status_code, 200)
            self.assertNotIn(identifier, [item["id"] for item in self.client.get(f"/api/{resource}/").data])
            self.assertEqual(self.client.delete(path).status_code, 204)

    def test_staff_cannot_change_account_permissions_or_owner_link(self):
        response = self.client.patch(f"/api/backoffice/users/{self.customer.pk}/", {"is_staff": True}, format="json")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.client.post("/api/backoffice/users/", {"username": "intruder", "password": "aLongPassword@2026"}, format="json").status_code, 403)
        self.assertEqual(self.client.patch(f"/api/backoffice/advertisers/{self.advertiser.pk}/", {"user": None}, format="json").status_code, 400)

    def test_superuser_can_create_reset_and_deactivate_customer_account(self):
        self.client.force_authenticate(self.superuser)
        path = "/api/backoffice/users/"
        self.assertEqual(self.client.post(path, {"username": "missing-password"}, format="json").status_code, 400)
        response = self.client.post(path, {"username": "new-customer", "password": "A-strong-example-2026", "is_superuser": True}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertNotIn("password", response.data)
        self.assertFalse(response.data["is_superuser"])
        user = get_user_model().objects.get(pk=response.data["id"])
        self.assertTrue(user.check_password("A-strong-example-2026"))
        response = self.client.patch(f"{path}{user.pk}/", {"password": "Different-example-2026", "is_active": False}, format="json")
        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertFalse(user.is_active)
        self.assertTrue(user.check_password("Different-example-2026"))
        self.assertEqual(self.client.delete(f"{path}{user.pk}/").status_code, 405)

    def test_superadministrator_accounts_remain_protected(self):
        self.client.force_authenticate(self.superuser)
        self.assertEqual(self.client.patch(f"/api/backoffice/users/{self.superuser.pk}/", {"is_active": False, "is_staff": False}, format="json").status_code, 400)
        self.superuser.refresh_from_db()
        self.assertTrue(self.superuser.is_active and self.superuser.is_staff)
        self.assertTrue(self.client.get("/api/auth/session/").data["is_superuser"])

    def test_superuser_can_link_only_a_customer_account(self):
        self.client.force_authenticate(self.superuser)
        path = f"/api/backoffice/advertisers/{self.advertiser.pk}/"
        self.assertEqual(self.client.patch(path, {"user": self.staff.pk}, format="json").status_code, 400)
        customer = get_user_model().objects.create_user("another-customer")
        self.assertEqual(self.client.patch(path, {"user": customer.pk}, format="json").status_code, 200)
