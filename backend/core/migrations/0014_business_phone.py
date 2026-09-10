from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0013_unique_business_public_subdomain")]

    operations = [
        migrations.AddField(
            model_name="business",
            name="phone",
            field=models.CharField(blank=True, max_length=30, verbose_name="telefone comercial"),
        ),
        migrations.AlterField(
            model_name="business",
            name="phone_whatsapp",
            field=models.CharField(max_length=30, verbose_name="WhatsApp"),
        ),
    ]
