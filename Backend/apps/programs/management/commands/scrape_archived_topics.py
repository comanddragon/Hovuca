from __future__ import annotations

import csv
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.programs.importing import ArchivedTopic, scrape_topics


class Command(BaseCommand):
    help = "Export the old HOVUCA navbar Topics hierarchy to CSV."

    def add_arguments(self, parser):
        project_root = Path(__file__).resolve().parents[5]
        parser.add_argument("--source", type=Path, default=project_root / "hovuca.org" / "news-post" / "index.htm")
        parser.add_argument("--output", type=Path, default=project_root / "Backend" / "data" / "archived_topics.csv")

    def handle(self, *args, **options):
        source = options["source"].resolve()
        output = options["output"].resolve()
        if not source.is_file():
            raise CommandError(f"Archive index not found: {source}")
        topics = scrape_topics(source)
        if not topics:
            raise CommandError("The Topics dropdown was not found in the archived navbar.")
        output.parent.mkdir(parents=True, exist_ok=True)
        with output.open("w", encoding="utf-8-sig", newline="") as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=list(ArchivedTopic.__dataclass_fields__))
            writer.writeheader()
            writer.writerows(topic.as_row() for topic in topics)
        self.stdout.write(self.style.SUCCESS(f"Exported {len(topics)} topics to {output}"))
