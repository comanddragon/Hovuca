from __future__ import annotations

import csv
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.donors.models import DonorOrganization
from apps.organization.models import Organization


class Command(BaseCommand):
    help = "Idempotently seed donor organizations exported by scrape_archived_donors."

    def add_arguments(self, parser):
        project_root = Path(__file__).resolve().parents[4]
        parser.add_argument("--csv", type=Path, default=project_root / "Backend" / "data" / "archived_donors.csv")
        parser.add_argument("--project-root", type=Path, default=project_root)
        parser.add_argument("--organization", type=str, default="hovuca", help="Organization slug or name to register donors under.")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        csv_path = options["csv"].resolve()
        project_root = options["project_root"].resolve()
        if not csv_path.is_file():
            raise CommandError(f"CSV file not found: {csv_path}. Run scrape_archived_donors first.")

        org_identifier = options.get("organization") or "hovuca"
        org = Organization.objects.filter(slug=org_identifier).first()
        if not org:
            org = Organization.objects.filter(name__iexact=org_identifier).first()
        if not org:
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

        created = updated = 0
        with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file, transaction.atomic():
            for row in csv.DictReader(csv_file):
                donor, was_created = DonorOrganization.objects.update_or_create(
                    slug=row["slug"],
                    defaults={
                        "organization": org,
                        "name": row["name"][:255],
                        "abbreviation": row.get("abbreviation", "")[:30],
                        "type": row.get("donor_type", DonorOrganization.Type.OTHER),
                        "status": DonorOrganization.Status.ACTIVE,
                        "prefers_anonymous": False,
                    },
                )
                logo_source = (project_root / row["logo_path"]).resolve()
                try:
                    logo_source.relative_to(project_root)
                except ValueError as exc:
                    raise CommandError(f"Logo path escapes project root: {row['logo_path']}") from exc
                if not logo_source.is_file():
                    raise CommandError(f"Donor logo not found: {logo_source}")
                if not donor.logo and not options["dry_run"]:
                    with logo_source.open("rb") as logo_file:
                        donor.logo.save(logo_source.name, File(logo_file), save=True)
                created += int(was_created)
                updated += int(not was_created)
            if options["dry_run"]:
                transaction.set_rollback(True)

        suffix = " (dry run; changes rolled back)" if options["dry_run"] else ""
        self.stdout.write(self.style.SUCCESS(f"{created} donors created, {updated} updated under organization '{org.name}'{suffix}"))
