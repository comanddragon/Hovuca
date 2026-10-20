"""Show the project's centralized scraping and seeding commands."""

from django.core.management.base import BaseCommand


SCRAPERS = (
    ("scrape_archived_topics", "Extract the archived topic hierarchy to CSV"),
    ("scrape_archived_blogs", "Extract archived articles to CSV"),
    ("scrape_archived_resources", "Extract archived downloadable resources to CSV"),
    ("scrape_archived_donors", "Build the archived donor CSV from curated logos"),
)

SEEDERS = (
    ("seed_archived_topics", "Import archived topics from CSV"),
    ("seed_archived_blogs", "Import archived articles from CSV"),
    ("seed_archived_resources", "Import archived resources from CSV"),
    ("seed_archived_donors", "Import archived donors from CSV"),
    ("seed_cse_course", "Import the CSE course CSV"),
    ("seed_production", "Run every production seeder in dependency order"),
)

UTILITIES = (
    ("audit_r2_media", "Verify database media references exist in R2"),
    ("format_seed_html", "Repair reviewed HTML in the blog and CSE CSVs"),
    ("rename_media_files", "Rename stored media after its owning object"),
)


class Command(BaseCommand):
    help = "List every centralized scraper, seeder, and seed-data utility."

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("HOVUCA data tools"))
        for heading, commands in (
            ("Scrapers", SCRAPERS),
            ("Seeders", SEEDERS),
            ("Utilities", UTILITIES),
        ):
            self.stdout.write(f"\n{heading}:")
            for name, description in commands:
                self.stdout.write(f"  python manage.py {name:<28} {description}")
        self.stdout.write(
            "\nUse `python manage.py <command> --help` for command-specific options."
        )
