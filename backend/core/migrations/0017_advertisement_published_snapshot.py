from django.db import migrations, models


def preserve_approved_profiles(apps, schema_editor):
    Advertisement = apps.get_model('core', 'Advertisement')
    # The previous release kept the approved Business profile visible while its
    # draft advertisement was reviewed. Preserve that existing state on upgrade.
    Advertisement.objects.filter(status__in=['published', 'review'], business__status='active').update(
        has_published_version=True,
        published_starts_at=models.F('starts_at'), published_ends_at=models.F('ends_at'))


class Migration(migrations.Migration):
    dependencies = [('core', '0016_advertisingsubscription_billing_anchor_day_and_more')]
    operations = [
        migrations.AddField(model_name='advertisement', name='has_published_version', field=models.BooleanField(default=False, editable=False)),
        migrations.AddField(model_name='advertisement', name='published_starts_at', field=models.DateField(null=True, blank=True, editable=False)),
        migrations.AddField(model_name='advertisement', name='published_ends_at', field=models.DateField(null=True, blank=True, editable=False)),
        migrations.RunPython(preserve_approved_profiles, migrations.RunPython.noop),
    ]
