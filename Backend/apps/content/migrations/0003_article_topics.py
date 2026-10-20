from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("blogs", "0002_resource"),
        ("programs", "0006_topic"),
    ]

    operations = [
        migrations.AddField(
            model_name="article",
            name="topics",
            field=models.ManyToManyField(
                blank=True, related_name="articles", to="programs.topic"
            ),
        ),
    ]
