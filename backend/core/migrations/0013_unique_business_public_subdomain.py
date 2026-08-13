from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0012_plan_benefits_and_business_marketing")]

    operations = [
        migrations.AddConstraint(
            model_name="business",
            constraint=models.UniqueConstraint(
                condition=~models.Q(("public_subdomain", "")),
                fields=("public_subdomain",),
                name="unique_non_empty_business_public_subdomain",
            ),
        ),
    ]
