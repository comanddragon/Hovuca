from __future__ import annotations

import csv
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.donors.importing import ArchivedDonor, scrape_donors


class Command(BaseCommand):
    help = "Export donor metadata from the curated donor-logo directory."

    def add_arguments(self, parser):
        project_root = Path(__file__).resolve().parents[5]
        parser.add_argument("--logos", type=Path, default=project_root / "frontend" / "public" / "donors")
        parser.add_argument("--output", type=Path, default=project_root / "Backend" / "data" / "archived_donors.csv")

    def handle(self, *args, **options):
        project_root = Path(__file__).resolve().parents[5]
        logo_directory = options["logos"].resolve()
        output = options["output"].resolve()
        if not logo_directory.is_dir():
            raise CommandError(f"Donor logo directory not found: {logo_directory}")
        donors = scrape_donors(logo_directory, project_root)
        output.parent.mkdir(parents=True, exist_ok=True)
        with output.open("w", encoding="utf-8-sig", newline="") as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=list(ArchivedDonor.__dataclass_fields__))
            writer.writeheader()
            writer.writerows(donor.as_row() for donor in donors)
        self.stdout.write(self.style.SUCCESS(f"Exported {len(donors)} donors to {output}"))
