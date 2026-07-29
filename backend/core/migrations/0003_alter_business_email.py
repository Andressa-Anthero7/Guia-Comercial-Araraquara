from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0002_business_logo_image_alter_business_image_url_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="business",
            name="email",
            field=models.EmailField(blank=True, max_length=254, verbose_name="e-mail"),
        ),
    ]
