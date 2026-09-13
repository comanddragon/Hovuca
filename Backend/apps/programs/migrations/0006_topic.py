import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("programs", "0005_project_progress_percentage_project_raised_amount")]

    operations = [
        migrations.CreateModel(
            name="Topic",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("name", models.CharField(max_length=255)),
                ("slug", models.SlugField(max_length=280, unique=True)),
                ("description", models.TextField(blank=True)),
                ("source_url", models.CharField(blank=True, max_length=500)),
                ("order", models.PositiveSmallIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("parent", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="children", to="programs.topic")),
            ],
            options={"db_table": "topics", "ordering": ["order", "name"]},
        )
    ]
