import csv
from unittest.mock import patch
from io import StringIO
from pathlib import Path

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from rest_framework.test import APIClient

from apps.organization.models import Organization
from apps.programs.models import Program, Project, ProjectActivity

CSV = Path(__file__).resolve().parents[3] / "data" / "document_projects.csv"


class DocumentProjectImportTests(TestCase):
    def setUp(self):
        self.organization, _ = Organization.objects.get_or_create(slug="hovuca", defaults={"name": "HOVUCA"})
        self.client = APIClient()

    def seed(self, **kwargs):
        call_command("seed_document_projects", stdout=StringIO(), **kwargs)

    def test_import_is_idempotent_and_preserves_evidence(self):
        self.seed()
        ids = set(Project.objects.values_list("id", flat=True))
        self.seed()
        self.assertEqual(Project.objects.count(), 13)
        self.assertEqual(set(Project.objects.values_list("id", flat=True)), ids)
        self.assertEqual(Program.objects.count(), 3)
        self.assertEqual(Project.objects.filter(evidence_type="research", status="completed").count(), 2)
        self.assertFalse(Project.objects.filter(evidence_type="proposal").exclude(status="planning").exists())
        tonga = Project.objects.get(slug="tonga-baseline-health-services-research-2024")
        self.assertEqual(len(tonga.source_documents), 2)
        self.assertIn("baseline", tonga.description)

    def test_dry_run_rolls_back_programs_and_projects(self):
        self.seed(dry_run=True)
        self.assertEqual(Project.objects.count(), 0)
        self.assertEqual(Program.objects.count(), 0)

    def test_slug_collision_rolls_back_every_change(self):
        program = Program.objects.create(organization=self.organization, title="Other", slug="other")
        Project.objects.create(program=program, title="Existing", slug="her-voice-safe-spaces-2020")
        with self.assertRaisesMessage(CommandError, "another program"):
            self.seed()
        self.assertEqual(Project.objects.count(), 1)
        self.assertEqual(Program.objects.count(), 1)

    def test_invalid_csv_does_not_write(self):
        with CSV.open(encoding="utf-8-sig", newline="") as stream:
            reader = csv.DictReader(stream)
            fields = reader.fieldnames
            rows = list(reader)
        rows[-1]["source_documents"] = '{"not": "a list"}'
        stream = StringIO()
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
        stream.seek(0)
        with patch.object(Path, "open", return_value=stream):
            with self.assertRaises(CommandError):
                self.seed()
        self.assertFalse(Project.objects.exists())
        self.assertFalse(Program.objects.exists())

    def test_api_filters_pagination_and_detail(self):
        self.seed()
        response = self.client.get("/api/v1/projects/", {"page_size": 6})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 13)
        self.assertEqual(len(response.data["results"]), 6)
        self.assertEqual(response.data["results"][0]["source_year"], 2024)
        response = self.client.get("/api/v1/projects/", {"evidence_type": "research"})
        self.assertEqual(response.data["count"], 2)
        response = self.client.get("/api/v1/projects/", {"search": "Mfou District"})
        self.assertEqual(response.data["count"], 1)
        response = self.client.get("/api/v1/projects/tonga-baseline-health-services-research-2024/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["source_documents"]), 2)
        self.assertTrue(response.data["evidence_notes"])
        self.assertEqual(self.client.get("/api/v1/projects/no-such-project/").status_code, 404)

    def test_multiple_organizations_require_selection(self):
        Organization.objects.create(name="Other", slug="other")
        with self.assertRaisesMessage(CommandError, "--organization"):
            self.seed()
        self.seed(organization=str(self.organization.pk))
        self.assertEqual(Project.objects.count(), 13)

    def test_activities_are_linked_idempotent_and_source_backed(self):
        self.seed()
        call_command("seed_document_activities", dry_run=True, stdout=StringIO())
        self.assertFalse(ProjectActivity.objects.exists())
        call_command("seed_document_activities", stdout=StringIO())
        ids = set(ProjectActivity.objects.values_list("id", flat=True))
        self.assertEqual(len(ids), 86)
        call_command("seed_document_activities", stdout=StringIO())
        self.assertEqual(set(ProjectActivity.objects.values_list("id", flat=True)), ids)
        self.assertEqual(ProjectActivity.objects.filter(evidence_status="reported").count(), 8)
        self.assertFalse(ProjectActivity.objects.filter(project__evidence_type="proposal", evidence_status="reported").exists())
        response = self.client.get("/api/v1/projects/tonga-baseline-health-services-research-2024/")
        self.assertEqual(len(response.data["activities"]), 4)
        self.assertEqual(response.data["activities"][0]["evidence_status"], "reported")

    def test_activity_seed_without_projects_is_atomic(self):
        with self.assertRaisesMessage(CommandError, "seed projects first"):
            call_command("seed_document_activities", stdout=StringIO())
        self.assertFalse(ProjectActivity.objects.exists())
