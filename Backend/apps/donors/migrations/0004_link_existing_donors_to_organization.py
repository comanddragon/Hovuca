# Generated data migration

from django.db import migrations


def link_donors_to_organization(apps, schema_editor):
    Organization = apps.get_model("organization", "Organization")
    DonorOrganization = apps.get_model("donors", "DonorOrganization")

    org, _ = Organization.objects.get_or_create(
        slug="hovuca",
        defaults={
            "name": "Hope for Vulnerable Children Association",
            "email": "contact@hovuca.org",
            "phone": "+237 696 230 391",
            "address": "Grande Chefferie Simbock, Yaoundé, Cameroon",
            "website": "https://hovuca.org",
            "is_active": True,
        },
    )

    DonorOrganization.objects.filter(organization__isnull=True).update(organization=org)


def unlink_donors_from_organization(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("donors", "0003_donororganization_organization"),
        ("organization", "0004_alter_organization_logo"),
    ]

    operations = [
        migrations.RunPython(
            link_donors_to_organization,
            reverse_code=unlink_donors_from_organization,
        ),
    ]
