from django.conf import settings
from django.db import migrations


def create_admin(apps, schema_editor):
    User = apps.get_model(*settings.AUTH_USER_MODEL.split("."))
    user, created = User.objects.get_or_create(
        username="admin",
        defaults={
            "is_staff": True,
            "is_superuser": True,
            "is_active": True,
            "password": "!",
        },
    )


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0004_seed_initial_portal"),
    ]

    operations = [
        migrations.RunPython(create_admin, migrations.RunPython.noop),
    ]
