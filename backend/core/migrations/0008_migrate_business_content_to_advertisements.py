from django.db import migrations


def create_primary_advertisements(apps, schema_editor):
    Business = apps.get_model("core", "Business")
    Advertisement = apps.get_model("core", "Advertisement")
    AdvertisementMedia = apps.get_model("core", "AdvertisementMedia")
    AdvertisingSubscription = apps.get_model("core", "AdvertisingSubscription")

    status_map = {
        "active": "published",
        "pending": "review",
        "draft": "draft",
        "inactive": "paused",
    }

    for business in Business.objects.all():
        advertisement, _ = Advertisement.objects.get_or_create(
            business=business,
            is_primary=True,
            defaults={
                "title": business.name,
                "short_description": business.description[:240],
                "description": business.description,
                "logo_image": business.logo_image,
                "cover_image": business.image_url,
                "status": status_map.get(business.status, "draft"),
                "is_featured": business.is_featured,
            },
        )
        advertisement.tags.set(business.tags.all())
        if not advertisement.media.exists():
            for image in business.images.all():
                AdvertisementMedia.objects.create(
                    advertisement=advertisement,
                    media_type="image",
                    file_data=image.image,
                    alt_text=image.alt_text,
                    order=image.order,
                )
        AdvertisingSubscription.objects.filter(
            business=business,
            advertisement__isnull=True,
        ).update(advertisement=advertisement)


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0007_advertisement_advertisingsubscription_advertisement_and_more"),
    ]

    operations = [
        migrations.RunPython(create_primary_advertisements, migrations.RunPython.noop),
    ]
