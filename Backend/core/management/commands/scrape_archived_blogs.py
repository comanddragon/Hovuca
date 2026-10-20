from __future__ import annotations

import csv
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.content.importing import ArchivedArticle, scrape_archive


class Command(BaseCommand):
    help = "Scrape the locally archived HOVUCA news pages into a UTF-8 CSV file."

    def add_arguments(self, parser):
        project_root = Path(__file__).resolve().parents[4]
        parser.add_argument(
            "--source",
            type=Path,
            default=project_root / "hovuca.org" / "news-post" / "index.htm",
            help="Path to the archived news index.htm file.",
        )
        parser.add_argument(
            "--output",
            type=Path,
            default=project_root / "Backend" / "data" / "archived_blogs.csv",
            help="Destination CSV path.",
        )

    def handle(self, *args, **options):
        source: Path = options["source"].resolve()
        output: Path = options["output"].resolve()
        if not source.is_file():
            raise CommandError(f"Archive index not found: {source}")

        articles = scrape_archive(source)
        if not articles:
            raise CommandError("No blog articles were found in the archive.")

        output.parent.mkdir(parents=True, exist_ok=True)
        fieldnames = list(ArchivedArticle.__dataclass_fields__)
        with output.open("w", encoding="utf-8-sig", newline="") as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(article.as_row() for article in articles)

        self.stdout.write(self.style.SUCCESS(f"Exported {len(articles)} articles to {output}"))
