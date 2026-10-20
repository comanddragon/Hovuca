import csv
import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify
from apps.programs.models import Project, ProjectActivity


class Command(BaseCommand):
    help = "Idempotently seed source-backed activities linked to archived projects."

    def add_arguments(self, parser):
        parser.add_argument("--csv", type=Path, default=Path(__file__).resolve().parents[3] / "data" / "document_project_activities.csv")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        path = options["csv"]
        if not path.is_file():
            raise CommandError(f"CSV not found: {path}")
        with path.open(encoding="utf-8-sig", newline="") as stream:
            rows = list(csv.DictReader(stream))
        if not rows:
            raise CommandError("CSV contains no activities")
        keys = set()
        for row in rows:
            try:
                key = (row["project_slug"], row["slug"])
                if key in keys or not row["slug"] or slugify(row["slug"]) != row["slug"]:
                    raise ValueError("invalid or duplicate slug")
                keys.add(key)
                for field in ["title", "period"]:
                    if len(row[field]) > 255 or not row["title"]:
                        raise ValueError(f"invalid {field}")
                if len(row["slug"]) > 280:
                    raise ValueError("slug too long")
                if row["evidence_status"] not in ProjectActivity.EvidenceStatus.values:
                    raise ValueError("invalid evidence status")
                row["order"] = int(row["order"])
                if not 0 <= row["order"] <= 32767:
                    raise ValueError("invalid order")
                row["source_documents"] = json.loads(row["source_documents"])
                if not isinstance(row["source_documents"], list) or not row["source_documents"] or not all(isinstance(item, str) and item for item in row["source_documents"]):
                    raise ValueError("invalid source documents")
            except (ValueError, TypeError, KeyError) as exc:
                raise CommandError(f"Invalid activity {row.get('slug', '?')}: {exc}") from exc
        created = updated = 0
        with transaction.atomic():
            projects = {}
            for slug in {row["project_slug"] for row in rows}:
                matches = Project.objects.filter(slug=slug)
                if matches.count() != 1:
                    raise CommandError(f"Expected one active project for {slug}; seed projects first")
                projects[slug] = matches.get()
            for row in rows:
                project = projects[row["project_slug"]]
                if row["evidence_status"] == "reported" and project.evidence_type in {"proposal", "plan"}:
                    raise CommandError(f"Cannot mark proposal activity reported: {row['slug']}")
                fields = ["title", "description", "period", "evidence_status", "order", "source_documents"]
                activity, was_created = ProjectActivity.all_objects.update_or_create(project=project, slug=row["slug"], defaults={field: row[field] for field in fields})
                if activity.deleted_at is not None:
                    raise CommandError(f"Activity {activity.slug} is deleted; restore explicitly before importing")
                created += int(was_created)
                updated += int(not was_created)
            if options["dry_run"]:
                transaction.set_rollback(True)
        suffix = " (dry run; rolled back)" if options["dry_run"] else ""
        self.stdout.write(self.style.SUCCESS(f"{created} activities created, {updated} updated{suffix}"))
