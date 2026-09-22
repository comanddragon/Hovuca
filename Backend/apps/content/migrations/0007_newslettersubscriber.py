from django.db import migrations, models
import uuid


class Migration(migrations.Migration):
    dependencies = [("blogs", "0006_alter_article_cover_image_alter_resource_file")]

    operations = [
        migrations.CreateModel(
            name="NewsletterSubscriber",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("is_active", models.BooleanField(default=True)),
                ("source", models.CharField(default="website", max_length=80)),
            ],
            options={"db_table": "newsletter_subscribers", "ordering": ["-created_at"]},
        ),
    ]
