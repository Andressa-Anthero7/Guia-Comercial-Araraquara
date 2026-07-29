from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0010_backofficenotification_pushsubscription"),
    ]

    operations = [
        migrations.AlterField(
            model_name="business",
            name="status",
            field=models.CharField(
                choices=[
                    ("draft", "Rascunho"),
                    ("pending", "Pendente"),
                    ("active", "Publicado"),
                    ("suspended", "Suspenso"),
                    ("inactive", "Inativo"),
                ],
                default="pending",
                max_length=20,
                verbose_name="status",
            ),
        ),
    ]
