import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("programs", "0009_project_document_evidence")]
    operations = [migrations.CreateModel(
        name="ProjectActivity",
        fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("updated_at", models.DateTimeField(auto_now=True)),
            ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
            ("slug", models.SlugField(max_length=280)),
            ("title", models.CharField(max_length=255)),
            ("description", models.TextField(blank=True)),
            ("period", models.CharField(blank=True, max_length=255)),
            ("evidence_status", models.CharField(choices=[("planned", "Planned in source"), ("reported", "Reported in source")], default="planned", max_length=20)),
            ("source_documents", models.JSONField(blank=True, default=list)),
            ("order", models.PositiveSmallIntegerField(default=0)),
            ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="activities", to="programs.project")),
        ],
        options={"db_table": "project_activities", "ordering": ["order", "title"], "constraints": [models.UniqueConstraint(fields=("project", "slug"), name="unique_project_activity_slug")]},
    )]
