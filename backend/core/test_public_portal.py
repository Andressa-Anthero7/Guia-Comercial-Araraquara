import base64
from unittest.mock import patch
from urllib.parse import urlencode, urlsplit

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import Advertiser, Business, BusinessImage


PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6pAAAAABJRU5ErkJggg=="


class PublicPortalTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.staff = get_user_model().objects.create_user(username="public-test-staff", is_staff=True)
        cls.business = Business.objects.create(
            name="Fotos publicadas", street="Rua Teste", number="1", phone="1633330000",
            phone_whatsapp="5516999990000", plan_type="paid", status="active", image_url=PNG,
        )
        cls.photo = BusinessImage.objects.create(business=cls.business, image=PNG, alt_text="Fachada")

    def setUp(self):
        self.client = APIClient()
        self.admin = APIClient()
        self.admin.force_authenticate(self.staff)
        push = patch("core.signals.send_notification_push")
        push.start()
        self.addCleanup(push.stop)

    def registration(self, **overrides):
        return {
            "name": "Cadastro público", "street": "Rua Nova", "number": "100",
            "phone": "(16) 3333-1234", "phone_whatsapp": "5516999991234", "image_url": PNG,
            **overrides,
        }

    def test_public_form_persists_contacts_and_cover_but_requires_approval(self):
        response = self.client.post(
            "/api/businesses/", urlencode(self.registration(status="active", plan_type="paid", is_featured="true")),
            content_type="application/x-www-form-urlencoded",
        )
        self.assertEqual(response.status_code, 201, response.data)
        business = Business.objects.get(pk=response.data["id"])
        self.assertEqual(business.phone, "(16) 3333-1234")
        self.assertEqual(business.phone_whatsapp, "5516999991234")
        self.assertEqual(business.image_url, PNG)
        self.assertEqual((business.status, business.plan_type, business.is_featured), ("pending", "free", False))
        self.assertNotIn("base64", response.data["image_url"])
        self.assertEqual(self.client.get(urlsplit(response.data["image_url"]).path).status_code, 404)
        approved = self.admin.patch(f"/api/backoffice/businesses/{business.slug}/", {"status": "active"}, format="json")
        self.assertEqual(approved.status_code, 200)
        cover = self.client.get(urlsplit(response.data["image_url"]).path)
        self.assertEqual(cover.status_code, 200)
        self.assertEqual(cover.content, base64.b64decode(PNG.split(",")[1]))

    def test_public_registration_accepts_external_cover(self):
        response = self.client.post("/api/businesses/", self.registration(image_url="https://example.com/cover.jpg"), format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Business.objects.get(pk=response.data["id"]).image_url, "https://example.com/cover.jpg")

    def test_public_registration_rejects_invalid_or_active_content_images(self):
        for value in ("data:image/png;base64,broken!", "data:text/html;base64,PGgxPk9pPC9oMT4=", "javascript:alert(1)", "data:image/png;base64,aGVsbG8="):
            with self.subTest(value=value):
                before = Business.objects.count()
                response = self.client.post("/api/businesses/", self.registration(image_url=value), format="json")
                self.assertEqual(response.status_code, 400)
                self.assertIn("image_url", response.data)
                self.assertEqual(Business.objects.count(), before)

    @override_settings(FILE_UPLOAD_MAX_MEMORY_SIZE=16)
    def test_public_registration_rejects_image_above_configured_limit(self):
        response = self.client.post("/api/businesses/", self.registration(), format="json")
        self.assertEqual(response.status_code, 400)

    def test_registration_rolls_back_when_tag_write_fails(self):
        before = Business.objects.count()
        with patch("core.serializers.Tag.objects.get_or_create", side_effect=RuntimeError("test failure")):
            with self.assertRaises(RuntimeError):
                self.client.post("/api/businesses/", self.registration(tags=["Teste"]), format="json")
        self.assertEqual(Business.objects.count(), before)

    def test_catalog_and_detail_expose_gallery_urls_and_metadata_without_base64(self):
        other = BusinessImage.objects.create(business=self.business, image="https://example.com/inside.jpg", alt_text="Interior", order=1)
        for path in ("/api/businesses/", f"/api/businesses/{self.business.slug}/"):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)
                data = response.data if isinstance(response.data, dict) else next(item for item in response.data if item["id"] == self.business.pk)
                self.assertEqual(len(data["images"]), 2)
                self.assertEqual(data["images"][0]["image"], data["image_url"])
                self.assertEqual(data["images"][1], {"id": other.pk, "image": other.image, "alt_text": "Interior", "order": 1})
                self.assertNotIn("base64", str(data))

    def test_gallery_binary_is_cacheable_and_scoped_to_published_owner(self):
        path = f"/api/businesses/{self.business.slug}/images/{self.photo.pk}/"
        response = self.client.get(path)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "image/png")
        self.assertEqual(response["Cache-Control"], "public, max-age=3600")
        self.assertEqual(response.content, base64.b64decode(PNG.split(",")[1]))
        other = Business.objects.create(name="Outro", street="Rua", number="2", phone_whatsapp="5516999990001", status="active")
        self.assertEqual(self.client.get(f"/api/businesses/{other.slug}/images/{self.photo.pk}/").status_code, 404)
        Business.objects.filter(pk=self.business.pk).update(status="pending")
        self.assertEqual(self.client.get(path).status_code, 404)
        self.assertEqual(self.client.get(f"/api/businesses/{self.business.slug}/cover/").status_code, 404)

    def test_replaced_cover_gets_a_new_cache_url(self):
        path = f"/api/businesses/{self.business.slug}/"
        before = self.client.get(path).data["image_url"]
        replacement = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        Business.objects.filter(pk=self.business.pk).update(image_url=replacement)
        after = self.client.get(path).data["image_url"]
        self.assertNotEqual(before, after)
        response = self.client.get(after)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, base64.b64decode(replacement.split(",")[1]))

    def test_advertiser_phone_edit_preserves_whatsapp_and_gallery(self):
        user = get_user_model().objects.create_user(username="public-test-advertiser")
        advertiser = Advertiser.objects.create(name="Responsável", user=user)
        advertiser.businesses.add(self.business)
        self.client.force_authenticate(user)
        response = self.client.patch(f"/api/advertiser/businesses/{self.business.slug}/", {"phone": "1633331111"}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.business.refresh_from_db()
        self.assertEqual(self.business.phone, "1633331111")
        self.assertEqual(self.business.phone_whatsapp, "5516999990000")
        self.assertTrue(self.business.images.filter(pk=self.photo.pk).exists())
