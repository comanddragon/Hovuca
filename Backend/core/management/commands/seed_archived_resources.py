from __future__ import annotations

import csv
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.dateparse import parse_datetime

from apps.blogs.models import Resource


class Command(BaseCommand):
    help = "Idempotently seed resources exported by scrape_archived_resources."

    def add_arguments(self, parser):
        project_root = Path(__file__).resolve().parents[4]
        parser.add_argument("--csv", type=Path, default=project_root / "Backend" / "data" / "archived_resources.csv")
        parser.add_argument("--archive-root", type=Path, default=project_root / "hovuca.org")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        csv_path = options["csv"].resolve()
        archive_root = options["archive_root"].resolve()
        if not csv_path.is_file():
            raise CommandError(f"CSV file not found: {csv_path}. Run scrape_archived_resources first.")

        created = updated = 0
        with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file, transaction.atomic():
            for row in csv.DictReader(csv_file):
                resource, was_created = Resource.objects.update_or_create(
                    slug=row["slug"],
                    defaults={
                        "title": row["title"][:255],
                        "description": row.get("description", ""),
                        "category": row.get("category", "Document")[:80] or "Document",
                        "published_at": parse_datetime(row.get("published_at", "")) if row.get("published_at") else None,
                        "is_active": True,
                    },
                )
                relative = Path(row["file_path"])
                source = (archive_root / relative).resolve()
                try:
                    source.relative_to(archive_root)
                except ValueError as exc:
                    raise CommandError(f"Resource path escapes archive root: {relative}") from exc
                if not source.is_file():
                    raise CommandError(f"Resource file not found: {source}")
                if not resource.file and not options["dry_run"]:
                    with source.open("rb") as source_file:
                        resource.file.save(source.name, File(source_file), save=True)
                created += int(was_created)
                updated += int(not was_created)
            if options["dry_run"]:
                transaction.set_rollback(True)

        suffix = " (dry run; changes rolled back)" if options["dry_run"] else ""
        self.stdout.write(self.style.SUCCESS(f"{created} resources created, {updated} updated{suffix}"))
