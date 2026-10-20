from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("elearning", "0002_module_age_max_module_age_min")]

    operations = [
        migrations.AddField(
            model_name="course",
            name="import_key",
            field=models.CharField(
                blank=True,
                editable=False,
                help_text="Stable identity used by repeatable content imports.",
                max_length=100,
                null=True,
                unique=True,
            ),
        ),
    ]
