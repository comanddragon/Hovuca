"""Idempotent, atomic import of reviewed project document summaries."""
import csv
import json
from datetime import date
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from apps.organization.models import Organization
from apps.programs.models import Program, Project

PROGRAMS = {
    "adolescent-health-and-rights": ("Adolescent health and rights", "Education, peer leadership and advocacy for adolescent girls, young women and young people in Cameroon."),
    "community-health": ("Community health", "Community education and participation in children’s health."),
    "research-and-evidence": ("Research and evidence", "Research documenting young people’s experiences and barriers to health information and services."),
}


class Command(BaseCommand):
    help = "Seed reviewed project summaries from document_projects.csv without deleting existing records."

    def add_arguments(self, parser):
        parser.add_argument("--csv", type=Path, default=Path(__file__).resolve().parents[3] / "data" / "document_projects.csv")
        parser.add_argument("--organization", help="Organization UUID; required when more than one active organization exists.")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        path = options["csv"]
        if not path.is_file():
            raise CommandError(f"CSV not found: {path}")
        with path.open(encoding="utf-8-sig", newline="") as stream:
            rows = list(csv.DictReader(stream))
        if not rows:
            raise CommandError("CSV contains no projects")
        slugs = set()
        for row in rows:
            try:
                slug = row["slug"]
                if not slug or slugify(slug) != slug or slug in slugs:
                    raise ValueError("invalid or duplicate slug")
                slugs.add(slug)
                if row["program_slug"] not in PROGRAMS:
                    raise ValueError("unknown program")
                if row["status"] not in Project.Status.values:
                    raise ValueError("invalid status")
                if row["evidence_type"] not in {"proposal", "plan", "research"}:
                    raise ValueError("invalid evidence type")
                row["source_year"] = int(row["source_year"])
                if not 1900 <= row["source_year"] <= 2100:
                    raise ValueError("invalid source year")
                for field, maximum in [("title", 255), ("slug", 280), ("excerpt", 500), ("location", 255), ("reporting_period", 255)]:
                    if len(row[field]) > maximum:
                        raise ValueError(f"{field} exceeds {maximum} characters")
                row["source_documents"] = json.loads(row["source_documents"])
                if not isinstance(row["source_documents"], list) or not row["source_documents"] or not all(isinstance(item, str) and item for item in row["source_documents"]):
                    raise ValueError("source_documents must be a nonempty list of filenames")
                for field in ["start_date", "end_date"]:
                    row[field] = date.fromisoformat(row[field]) if row[field] else None
                if row["start_date"] and row["end_date"] and row["end_date"] < row["start_date"]:
                    raise ValueError("end date precedes start date")
            except (KeyError, TypeError, ValueError) as exc:
                raise CommandError(f"Invalid record {row.get('slug', '?')}: {exc}") from exc
        organizations = Organization.objects.filter(is_active=True, deleted_at__isnull=True)
        if options["organization"]:
            organizations = organizations.filter(pk=options["organization"])
        if organizations.count() != 1:
            raise CommandError("Select one active organization with --organization UUID")
        organization = organizations.get()
        created = updated = 0
        with transaction.atomic():
            programs = {}
            for slug in {row["program_slug"] for row in rows}:
                title, description = PROGRAMS[slug]
                program, _ = Program.objects.get_or_create(slug=slug, defaults={"organization": organization, "title": title, "excerpt": description, "description": description, "status": Program.Status.ACTIVE})
                if program.organization_id != organization.id or program.deleted_at is not None:
                    raise CommandError(f"Program {slug} belongs to another organization or is deleted")
                programs[slug] = program
            for row in rows:
                program = programs[row["program_slug"]]
                # Public routes resolve by slug alone: reject collisions across programs.
                conflicts = Project.all_objects.filter(slug=row["slug"]).exclude(program=program)
                if conflicts.exists():
                    raise CommandError(f"Slug already belongs to another program: {row['slug']}")
                fields = ["title", "excerpt", "description", "status", "start_date", "end_date", "evidence_type", "source_year", "location", "reporting_period", "source_documents", "evidence_notes"]
                project, was_created = Project.all_objects.update_or_create(program=program, slug=row["slug"], defaults={key: row[key] for key in fields})
                if project.deleted_at is not None:
                    raise CommandError(f"Project {project.slug} is deleted; restore it explicitly before importing")
                created += int(was_created)
                updated += int(not was_created)
            if options["dry_run"]:
                transaction.set_rollback(True)
        suffix = " (dry run; rolled back)" if options["dry_run"] else ""
        self.stdout.write(self.style.SUCCESS(f"{created} projects created, {updated} updated{suffix}"))
