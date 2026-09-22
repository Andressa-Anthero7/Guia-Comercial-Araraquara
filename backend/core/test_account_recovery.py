from urllib.parse import parse_qs, urlparse
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import Advertiser
from .account_recovery import email_connection


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
                   PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class AccountRecoveryTests(TestCase):
    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            "recovery-customer", email="customer@example.test", password="Previous-pass-937!")
        self.advertiser = Advertiser.objects.create(name="Recovery", user=self.user, status="active")

    def request_link(self, email="customer@example.test"):
        return self.client.post("/api/auth/password-reset/", {"email": email}, format="json")

    def token_data(self):
        self.assertEqual(self.request_link().status_code, 200)
        url = next(line for line in mail.outbox[-1].body.splitlines() if line.startswith("https://"))
        return {key: values[0] for key, values in parse_qs(urlparse(url).query).items()}

    def test_email_link_changes_password_once_and_allows_login(self):
        data = {**self.token_data(), "password": "New-private-pass-834!"}
        self.assertEqual(self.client.post("/api/auth/password-reset/confirm/", data, format="json").status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(data["password"]))
        self.assertEqual(self.client.post("/api/auth/password-reset/confirm/", data, format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/auth/advertiser/login/", {
            "username": self.user.username, "password": data["password"]}, format="json").status_code, 200)

    def test_unknown_email_has_same_response_without_sending_mail(self):
        known = self.request_link()
        unknown = self.request_link("unknown@example.test")
        self.assertEqual(known.data, unknown.data)
        self.assertEqual(unknown.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)

    def test_inactive_and_staff_accounts_do_not_receive_links(self):
        self.advertiser.status = "inactive"
        self.advertiser.save()
        self.assertEqual(self.request_link().status_code, 200)
        self.advertiser.status = "active"
        self.advertiser.save()
        self.user.is_staff = True
        self.user.save()
        self.assertEqual(self.request_link().status_code, 200)
        self.assertEqual(len(mail.outbox), 0)

    def test_invalid_token_and_weak_password_preserve_password(self):
        data = self.token_data()
        for payload in [{**data, "token": "invalid", "password": "New-pass-834!"},
                        {**data, "password": "123"}]:
            self.assertEqual(self.client.post("/api/auth/password-reset/confirm/", payload, format="json").status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Previous-pass-937!"))

    def test_missing_email_service_is_reported_as_unavailable(self):
        with patch("core.account_recovery.email_connection", return_value=None):
            self.assertEqual(self.request_link().status_code, 503)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend")
    def test_smtp_supports_ssl_and_rejects_conflicting_modes(self):
        import os
        with patch.dict(os.environ, {"EMAIL_HOST": "smtp.example.test", "EMAIL_USE_SSL": "true", "EMAIL_USE_TLS": "false", "EMAIL_PORT": "465"}):
            connection = email_connection()
            self.assertTrue(connection.use_ssl)
            self.assertFalse(connection.use_tls)
            self.assertEqual(connection.port, 465)
            with patch.dict(os.environ, {"EMAIL_USE_TLS": "true"}):
                self.assertIsNone(email_connection())
            with patch.dict(os.environ, {"EMAIL_PORT": "invalid"}):
                self.assertIsNone(email_connection())
