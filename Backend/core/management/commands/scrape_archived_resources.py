from __future__ import annotations

import csv
import hashlib
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.blogs.importing import ArchivedResource, scrape_resources, scrape_uploads


class Command(BaseCommand):
    help = "Export downloadable resources from the archived HOVUCA resources page."

    def add_arguments(self, parser):
        project_root = Path(__file__).resolve().parents[4]
        parser.add_argument("source", nargs="?", type=Path, default=project_root / "hovuca.org" / "home" / "documents" / "index.htm")
        parser.add_argument("--additional-source", type=Path, default=project_root / "hovuca.org" / "resources" / "index.htm")
        parser.add_argument("--output", type=Path, default=project_root / "Backend" / "data" / "archived_resources.csv")

    def handle(self, *args, **options):
        project_root = Path(__file__).resolve().parents[4]
        source = options["source"].resolve()
        output = options["output"].resolve()
        if not source.is_file():
            raise CommandError(f"Archived resources page not found: {source}")
        sources = [source, options["additional_source"].resolve()]
        resources_by_digest = {}
        archive_root = project_root / "hovuca.org"
        for page in sources:
            if not page.is_file():
                raise CommandError(f"Archived resources page not found: {page}")
            for resource in scrape_resources(page):
                digest = hashlib.sha256((archive_root / resource.file_path).read_bytes()).hexdigest()
                resources_by_digest.setdefault(digest, resource)
        for resource in scrape_uploads(archive_root):
            digest = hashlib.sha256((archive_root / resource.file_path).read_bytes()).hexdigest()
            resources_by_digest.setdefault(digest, resource)
        resources = list(resources_by_digest.values())
        output.parent.mkdir(parents=True, exist_ok=True)
        with output.open("w", encoding="utf-8-sig", newline="") as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=list(ArchivedResource.__dataclass_fields__))
            writer.writeheader()
            writer.writerows(resource.as_row() for resource in resources)
        self.stdout.write(self.style.SUCCESS(f"Exported {len(resources)} resources to {output}"))
