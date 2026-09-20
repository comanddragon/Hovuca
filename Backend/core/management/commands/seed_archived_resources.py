from __future__ import annotations

import csv
import logging
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.dateparse import parse_datetime

from apps.blogs.models import Resource

logger = logging.getLogger(__name__)


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

        logger.info("Seeding resources from %s (dry_run=%s)", csv_path, options["dry_run"])

        created = updated = uploaded = 0
        with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file, transaction.atomic():
            for row in csv.DictReader(csv_file):
                logger.debug("Processing row: slug=%s file_path=%s", row["slug"], row["file_path"])
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
                logger.info("%s resource: %s", "Created" if was_created else "Updated", resource.slug)

                relative = Path(row["file_path"])
                source = (archive_root / relative).resolve()
                try:
                    source.relative_to(archive_root)
                except ValueError as exc:
                    logger.error("Resource path escapes archive root: %s", relative)
                    raise CommandError(f"Resource path escapes archive root: {relative}") from exc
                if not source.is_file():
                    logger.error("Resource file not found: %s", source)
                    raise CommandError(f"Resource file not found: {source}")

                if not resource.file and not options["dry_run"]:
                    with source.open("rb") as source_file:
                        resource.file.save(source.name, File(source_file), save=True)
                    uploaded += 1
                    logger.info("Uploaded file for %s: %s", resource.slug, source.name)
                elif not resource.file:
                    logger.debug("Skipped file upload for %s (dry run)", resource.slug)
                else:
                    logger.debug("File already attached for %s, skipping upload", resource.slug)

                created += int(was_created)
                updated += int(not was_created)
            if options["dry_run"]:
                transaction.set_rollback(True)
                logger.info("Dry run complete, rolling back transaction")

        suffix = " (dry run; changes rolled back)" if options["dry_run"] else ""
        logger.info("Done: %d created, %d updated, %d files uploaded%s", created, updated, uploaded, suffix)
        self.stdout.write(self.style.SUCCESS(f"{created} resources created, {updated} updated{suffix}"))