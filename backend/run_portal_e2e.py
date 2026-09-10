"""Run the browser integration API against a disposable database only."""
import os
from pathlib import Path
from tempfile import TemporaryDirectory

os.environ["DJANGO_SETTINGS_MODULE"] = "project.settings"
os.environ["DATABASE_URL"] = ""
os.environ["WEBPUSH_VAPID_PRIVATE_KEY"] = ""
os.environ["DJANGO_SECURE_COOKIES"] = "false"

import django
from django.conf import settings


def main():
    with TemporaryDirectory(prefix="gca-portal-e2e-") as directory:
        settings.DATABASES = {"default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": Path(directory) / "portal.sqlite3",
        }}
        settings.ALLOWED_HOSTS = ["127.0.0.1", "localhost"]
        settings.DEBUG = False
        django.setup()
        from django.contrib.auth import get_user_model
        from django.core.management import call_command
        from core.models import Advertiser, Business

        call_command("migrate", verbosity=0, interactive=False)
        # These records exist exclusively in the database created above.
        Business.objects.update(status="inactive")
        get_user_model().objects.create_user(
            username="portal-e2e-admin", password="local-e2e-password", is_staff=True,
        )
        legacy_business = Business.objects.create(
            name="Contato legado de teste", street="Rua Teste", number="10",
            phone_whatsapp="16988887777", status="active",
        )
        advertiser_user = get_user_model().objects.create_user(
            username="portal-e2e-advertiser", password="local-e2e-password",
        )
        advertiser = Advertiser.objects.create(
            name="Anunciante de integração", user=advertiser_user, status="active",
        )
        advertiser.businesses.add(legacy_business)
        call_command("runserver", "127.0.0.1:8001", use_reloader=False)


if __name__ == "__main__":
    main()
