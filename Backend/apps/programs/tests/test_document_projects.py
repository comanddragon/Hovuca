import csv
import tempfile
from io import StringIO
from pathlib import Path

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from rest_framework.test import APIClient

from apps.organization.models import Organization
from apps.programs.models import Program, Project

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
        self.assertIn("600", tonga.description)

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
        with tempfile.TemporaryDirectory(dir=CSV.parent) as folder:
            path = Path(folder) / "invalid.csv"
            with path.open("w", encoding="utf-8", newline="") as stream:
                writer = csv.DictWriter(stream, fieldnames=fields)
                writer.writeheader()
                writer.writerows(rows)
            with self.assertRaises(CommandError):
                self.seed(csv=path)
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
