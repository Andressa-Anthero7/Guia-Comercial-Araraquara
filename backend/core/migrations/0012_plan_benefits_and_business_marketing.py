from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0011_alter_business_status")]

    operations = [
        migrations.AddField(model_name="advertisingplan", name="includes_coupons", field=models.BooleanField(default=True, verbose_name="inclui cupons")),
        migrations.AddField(model_name="advertisingplan", name="includes_custom_page", field=models.BooleanField(default=True, verbose_name="inclui pagina personalizada")),
        migrations.AddField(model_name="advertisingplan", name="includes_marketing", field=models.BooleanField(default=True, verbose_name="inclui apoio de marketing")),
        migrations.AddField(model_name="advertisingplan", name="max_images", field=models.PositiveSmallIntegerField(default=5, verbose_name="limite de imagens")),
        migrations.AddField(model_name="advertisingplan", name="plan_type", field=models.CharField(choices=[("free", "Gratuito"), ("paid", "Pago")], default="paid", max_length=12, verbose_name="tipo")),
        migrations.AddField(model_name="business", name="google_ads_id", field=models.CharField(blank=True, max_length=80, verbose_name="Google Ads")),
        migrations.AddField(model_name="business", name="google_analytics_id", field=models.CharField(blank=True, max_length=80, verbose_name="Google Analytics")),
        migrations.AddField(model_name="business", name="meta_pixel_id", field=models.CharField(blank=True, max_length=80, verbose_name="Meta Pixel")),
        migrations.AddField(model_name="business", name="plan_type", field=models.CharField(choices=[("free", "Gratuito"), ("paid", "Pago")], default="free", max_length=12, verbose_name="modalidade")),
        migrations.AddField(model_name="business", name="public_subdomain", field=models.SlugField(blank=True, max_length=80, verbose_name="subdominio da pagina")),
        migrations.AddField(model_name="business", name="services_products", field=models.TextField(blank=True, verbose_name="servicos e produtos")),
    ]
