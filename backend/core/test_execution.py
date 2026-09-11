from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import (Advertisement, Advertiser, AdvertisingPlan, AdvertisingSubscription,
                     Business, BusinessImage, BusinessDailyMetric, Coupon, Invoice, Review)
from .billing import renew_subscriptions
from .benefits import business_benefits


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class PublicationAndFinanceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff = get_user_model().objects.create_user("manager", is_staff=True)
        self.business = Business.objects.create(name="Empresa", street="Rua", number="1",
            phone_whatsapp="16999999999", status="active", plan_type="paid", image_url="https://example.com/cover.png")
        self.today = date(2026, 9, 10)
        self.image = BusinessImage.objects.create(business=self.business, image="https://example.com/photo.png")
        Review.objects.create(business=self.business, author_name="Cliente", rating=5, is_approved=True)
        Coupon.objects.create(business=self.business, title="Cupom", discount_code="PROMO", is_active=True)

    def assert_public(self, visible):
        self.client.force_authenticate(None)
        with patch("core.publication.timezone.localdate", return_value=self.today):
            self.assertEqual(self.business.pk in [item["id"] for item in self.client.get("/api/businesses/").data], visible)
            self.assertEqual(self.client.get(f"/api/businesses/{self.business.slug}/").status_code, 200 if visible else 404)
            self.assertEqual(self.client.get(f"/api/businesses/{self.business.slug}/cover/").status_code, 302 if visible else 404)
            self.assertEqual(self.client.get(f"/api/businesses/{self.business.slug}/images/{self.image.pk}/").status_code, 302 if visible else 404)
            for path in ("reviews", "coupons"):
                self.assertEqual(len(self.client.get(f"/api/{path}/?business={self.business.slug}").data), int(visible))

    def test_scheduled_principal_has_inclusive_dates_and_automatic_expiry(self):
        ad = Advertisement.objects.create(business=self.business, title="Campanha", status="published",
            starts_at=self.today + timedelta(days=1), ends_at=self.today + timedelta(days=2))
        self.assert_public(False)
        self.today += timedelta(days=1)
        self.assert_public(True)
        self.today += timedelta(days=1)
        self.assert_public(True)
        self.today += timedelta(days=1)
        self.assert_public(False)
        self.assertTrue(Advertisement.objects.filter(pk=ad.pk).exists())
        self.assertTrue(Business.objects.filter(pk=self.business.pk).exists())

    def test_pausing_hides_all_public_surfaces_but_preserves_data(self):
        ad = Advertisement.objects.create(business=self.business, title="Campanha", status="published")
        self.assert_public(True)
        ad.status = "paused"
        ad.save()
        self.assert_public(False)
        ad.status = "published"
        ad.save()
        self.assert_public(True)

    def test_no_campaign_and_secondary_campaign_do_not_hide_listing(self):
        self.assert_public(True)
        Advertisement.objects.create(business=self.business, title="Secundário", status="paused", is_primary=False)
        self.assert_public(True)
        self.business.status = "suspended"
        self.business.save()
        self.assert_public(False)

    def test_staff_scheduling_does_not_expose_future_content(self):
        self.business.status = "inactive"
        self.business.save()
        self.client.force_authenticate(self.staff)
        response = self.client.post("/api/backoffice/advertisements/", {
            "business": self.business.pk, "title": "Futuro", "description": "Oferta futura",
            "cover_image": "https://example.com/cover.png",
            "status": "published", "is_primary": True,
            "starts_at": str(self.today + timedelta(days=1)),
        }, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assert_public(False)
        self.today += timedelta(days=1)
        self.assert_public(True)

    def test_summary_includes_explicit_overdue_and_excludes_paid_cancelled(self):
        advertiser = Advertiser.objects.create(name="Cliente")
        plan = AdvertisingPlan.objects.create(name="Plano", price="100")
        subscription = AdvertisingSubscription.objects.create(advertiser=advertiser, business=self.business,
            plan=plan, start_date=self.today, next_due_date=self.today, agreed_price="100")
        for status, days, amount in [("overdue", 2, "100"), ("open", -1, "200"), ("open", 1, "50"), ("paid", -1, "70"), ("cancelled", -1, "90")]:
            Invoice.objects.create(subscription=subscription, reference_month=self.today, due_date=self.today+timedelta(days=days),
                amount=amount, status=status, paid_at=self.today if status=="paid" else None)
        self.client.force_authenticate(self.staff)
        with patch("core.views.timezone.localdate", return_value=self.today):
            response = self.client.get("/api/backoffice/finance-summary/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Decimal(response.data["open_amount"]), Decimal("350"))
        self.assertEqual(Decimal(response.data["overdue_amount"]), Decimal("300"))
        self.assertEqual(response.data["overdue_count"], 2)
        self.assertEqual(response.data["due_soon_count"], 1)
        self.assertEqual(Decimal(response.data["received_this_month"]), Decimal("70"))

    def test_metrics_count_only_valid_visible_business_events_and_isolate_accounts(self):
        path = f"/api/businesses/{self.business.slug}/events/"
        self.assertEqual(self.client.post(path, {"event": "view"}, format="json").status_code, 204)
        self.assertEqual(self.client.post(path, {"event": "whatsapp"}, format="json").status_code, 204)
        self.assertEqual(self.client.post(path, {"event": "invalid"}, format="json").status_code, 400)
        self.assertEqual(BusinessDailyMetric.objects.filter(business=self.business).count(), 2)
        user = get_user_model().objects.create_user("advertiser")
        advertiser = Advertiser.objects.create(user=user, name="Anunciante")
        self.client.force_authenticate(user)
        self.assertEqual(self.client.get("/api/advertiser/portal/").data["metrics"]["totals"], [])
        advertiser.businesses.add(self.business)
        totals = self.client.get("/api/advertiser/portal/").data["metrics"]["totals"]
        self.assertEqual(sum(row["count"] for row in totals), 2)
        self.business.status = "suspended"
        self.business.save()
        self.assertEqual(self.client.post(path, {"event": "view"}, format="json").status_code, 404)

    def test_advertiser_photo_validation_and_ownership(self):
        user = get_user_model().objects.create_user("photos")
        advertiser = Advertiser.objects.create(user=user, name="Fotos")
        self.client.force_authenticate(user)
        path = f"/api/advertiser/businesses/{self.business.slug}/"
        self.assertEqual(self.client.patch(path, {"image_url": "https://example.com/new.png"}, format="json").status_code, 404)
        advertiser.businesses.add(self.business)
        invalid = self.client.patch(path, {"name": "Not saved", "images": ["data:image/svg+xml;base64,PHN2Zz4="]}, format="json")
        self.assertEqual(invalid.status_code, 400)
        self.business.refresh_from_db()
        self.assertEqual(self.business.name, "Empresa")
        saved = self.client.patch(path, {"image_url": "https://example.com/new.png", "images": ["https://example.com/1.png"]}, format="json")
        self.assertEqual(saved.status_code, 200, saved.data)
        self.assertEqual(self.client.get(f"/api/businesses/{self.business.slug}/").data["images"][0]["image"], "https://example.com/1.png")

    def make_subscription(self, **overrides):
        advertiser = Advertiser.objects.create(name="Contrato")
        advertiser.businesses.add(self.business)
        plan = AdvertisingPlan.objects.create(name="Plano", price="100", max_images=2, max_ads=2,
            includes_coupons=False, includes_marketing=False, includes_custom_page=False)
        data = dict(advertiser=advertiser, business=self.business, plan=plan, start_date=date(2026,1,31),
            next_due_date=date(2026,1,31), agreed_price="100", auto_renew=True)
        data.update(overrides)
        return AdvertisingSubscription.objects.create(**data)

    def test_billing_is_idempotent_preserves_anchor_and_existing_invoice(self):
        subscription = self.make_subscription()
        Invoice.objects.create(subscription=subscription, reference_month=date(2026,1,1), due_date=date(2026,1,31), amount="100", status="paid", paid_at=date(2026,1,31))
        result = renew_subscriptions(date(2026,3,31))
        self.assertEqual(result["created"], 2)
        self.assertEqual(result["existing"], 1)
        self.assertEqual(list(subscription.invoices.order_by('due_date').values_list('due_date',flat=True)), [date(2026,1,31),date(2026,2,28),date(2026,3,31)])
        self.assertEqual(renew_subscriptions(date(2026,3,31))["created"], 0)
        subscription.refresh_from_db()
        self.assertEqual(subscription.next_due_date, date(2026,4,30))
        self.assertEqual(subscription.invoices.filter(status="paid").count(),1)

    def test_billing_stops_for_cancelled_nonrenewing_and_end_date(self):
        subscription = self.make_subscription(end_date=date(2026,2,28))
        self.assertEqual(renew_subscriptions(date(2026,5,31))["created"], 2)
        subscription.status="cancelled"
        subscription.save()
        self.assertEqual(renew_subscriptions(date(2026,6,30))["created"],0)
        subscription.status="active"
        subscription.auto_renew=False
        subscription.end_date=None
        subscription.save()
        self.assertEqual(renew_subscriptions(date(2026,6,30))["created"],0)

    def test_subscription_limits_and_expiry_preserve_stored_business(self):
        subscription = self.make_subscription(end_date=self.today)
        self.business.public_subdomain="empresa"
        self.business.meta_pixel_id="123456789"
        self.business.save()
        with patch("core.benefits.timezone.localdate",return_value=self.today):
            data=self.client.get(f"/api/businesses/{self.business.slug}/").data
            self.assertEqual(data['benefits']['max_images'],2)
            self.assertEqual(data['public_subdomain'],'')
            self.assertEqual(data['meta_pixel_id'],'')
            self.assertEqual(self.client.get(f"/api/coupons/?business={self.business.slug}").data,[])
        benefits=business_benefits(self.business,self.today+timedelta(days=1))
        self.assertEqual(benefits['plan_type'],'free')
        self.business.refresh_from_db()
        self.assertEqual(self.business.public_subdomain,'empresa')
        self.assertEqual(self.business.meta_pixel_id,'123456789')
