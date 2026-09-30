from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("programs", "0008_alter_program_banner_alter_project_cover_image")]
    operations = [
        migrations.AddField(model_name="project", name="evidence_type", field=models.CharField(blank=True, choices=[("proposal", "Funding proposal"), ("plan", "Implementation plan"), ("research", "Research report")], max_length=20)),
        migrations.AddField(model_name="project", name="source_year", field=models.PositiveSmallIntegerField(blank=True, null=True)),
        migrations.AddField(model_name="project", name="location", field=models.CharField(blank=True, max_length=255)),
        migrations.AddField(model_name="project", name="reporting_period", field=models.CharField(blank=True, max_length=255)),
        migrations.AddField(model_name="project", name="source_documents", field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name="project", name="evidence_notes", field=models.TextField(blank=True)),
    ]
