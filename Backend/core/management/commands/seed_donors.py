from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.donors.models import DonorOrganization

DONORS = [
    ("Allstars Consultancy", "ALLSTARS", "allstars-consultancy.png", DonorOrganization.Type.CORPORATION),
    ("Bejema Health Care", "BEJEMA", "bejema-health-care.jpg", DonorOrganization.Type.CORPORATION),
    ("European Union", "EU", "european-union.jpg", DonorOrganization.Type.MULTILATERAL),
    ("Every Breath Counts Coalition", "EBC", "every-breath-counts.png", DonorOrganization.Type.NGO),
    ("UNAIDS Cameroon", "UNAIDS", "unaids-cameroon.jpeg", DonorOrganization.Type.MULTILATERAL),
    ("United Nations Population Fund", "UNFPA", "unfpa.jpeg", DonorOrganization.Type.MULTILATERAL),
    ("Women Environmental Programme", "WEP", "women-environmental-programme.jpeg", DonorOrganization.Type.NGO),
    ("ACT Ubumbano", "", "act-ubumbano.png", DonorOrganization.Type.NGO),
    ("Government of Canada", "", "government-of-canada.png", DonorOrganization.Type.GOVERNMENT),
    ("Fondation Merieux", "", "fondation-merieux.jpeg", DonorOrganization.Type.FOUNDATION),
    ("Frontline AIDS", "", "frontline-aids.png", DonorOrganization.Type.NGO),
    ("The Global Fund", "", "global-fund.jpeg", DonorOrganization.Type.MULTILATERAL),
    ("Her Voice Fund", "", "her-voice-fund.png", DonorOrganization.Type.FOUNDATION),
    ("The Braiding Zone", "", "the-braiding-zone.jpg", DonorOrganization.Type.OTHER),
    ("ViiV Healthcare Positive Action", "ViiV", "viiv-healthcare.jpeg", DonorOrganization.Type.CORPORATION),
    ("Women 2030", "", "women-2030.jpeg", DonorOrganization.Type.NGO),
    ("World Pneumonia Day", "", "world-pneumonia-day.jpeg", DonorOrganization.Type.OTHER),
    ("Y+ Global", "", "y-plus-global.jpeg", DonorOrganization.Type.NGO),
]


class Command(BaseCommand):
    help = "Seed HOVUCA's donor and partner organizations with their supplied logos."

    def handle(self, *args, **options):
        assets_dir = Path(__file__).resolve().parent / "seed_assets" / "donors"
        created_count = 0
        updated_count = 0

        for name, abbreviation, asset_name, donor_type in DONORS:
            donor, created = DonorOrganization.objects.update_or_create(
                slug=slugify(name),
                defaults={
                    "name": name,
                    "abbreviation": abbreviation,
                    "type": donor_type,
                    "status": DonorOrganization.Status.ACTIVE,
                    "prefers_anonymous": False,
                },
            )

            source = assets_dir / asset_name
            if not source.exists():
                self.stderr.write(self.style.WARNING(f"Logo not found: {source}"))
            elif not donor.logo:
                with source.open("rb") as source_file:
                    donor.logo.save(asset_name, File(source_file), save=True)

            created_count += int(created)
            updated_count += int(not created)

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(DONORS)} donors ({created_count} created, {updated_count} updated)."
        ))
