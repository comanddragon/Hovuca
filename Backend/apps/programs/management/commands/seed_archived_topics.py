from __future__ import annotations

import csv
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.programs.models import Topic


class Command(BaseCommand):
    help = "Idempotently seed site-wide topics from archived_topics.csv."

    def add_arguments(self, parser):
        project_root = Path(__file__).resolve().parents[5]
        parser.add_argument("--csv", type=Path, default=project_root / "Backend" / "data" / "archived_topics.csv")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        csv_path = options["csv"].resolve()
        if not csv_path.is_file():
            raise CommandError(f"CSV file not found: {csv_path}. Run scrape_archived_topics first.")
        with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
            rows = list(csv.DictReader(csv_file))

        created = updated = 0
        topics: dict[str, Topic] = {}
        with transaction.atomic():
            for row in sorted(rows, key=lambda item: (int(item.get("depth") or 0), int(item.get("order") or 0))):
                parent = topics.get(row.get("parent_slug", ""))
                topic, was_created = Topic.objects.update_or_create(
                    slug=row["slug"],
                    defaults={
                        "name": row["name"][:255],
                        "description": row.get("description", ""),
                        "parent": parent,
                        "source_url": row.get("source_url", "")[:500],
                        "order": int(row.get("order") or 0),
                        "is_active": True,
                    },
                )
                topics[topic.slug] = topic
                created += int(was_created)
                updated += int(not was_created)
            if options["dry_run"]:
                transaction.set_rollback(True)

        suffix = " (dry run; changes rolled back)" if options["dry_run"] else ""
        self.stdout.write(self.style.SUCCESS(f"{created} topics created, {updated} updated{suffix}"))
