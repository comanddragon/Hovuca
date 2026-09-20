import os

from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError


SEED_COMMANDS = (
    "seed_archived_topics",
    "seed_archived_blogs",
    "seed_archived_resources",
    "seed_archived_donors",
    "seed_cse_course"
)


class Command(BaseCommand):
    help = "Run every idempotent HOVUCA seeder against the development database."
    requires_migrations_checks = True

    def handle(self, *args, **options):
        settings_module = os.environ.get("DJANGO_SETTINGS_MODULE", "")
        if settings_module != "config.settings.development":
            raise CommandError(
                "This command only runs with DJANGO_SETTINGS_MODULE="
                "config.settings.development."
            )

        for command_name in SEED_COMMANDS:
            self.stdout.write(self.style.MIGRATE_HEADING(f"Running {command_name}..."))
            call_command(command_name, stdout=self.stdout, stderr=self.stderr)

        self.stdout.write(self.style.SUCCESS("All development seeders completed."))
