import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("blogs", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="Resource",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("title", models.CharField(max_length=255)),
                ("slug", models.SlugField(max_length=280, unique=True)),
                ("description", models.TextField(blank=True)),
                ("category", models.CharField(default="Document", max_length=80)),
                ("file", models.FileField(upload_to="resources/documents/")),
                ("published_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={"db_table": "resources", "ordering": ["-published_at", "title"]},
        ),
    ]
