import json
from decimal import Decimal

from django.contrib.admin.models import LogEntry
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.donations.models import Donation, DonationPaymentSettings
from apps.organization.models import Organization
from apps.programs.models import Program, Project
from core.admin_api import CATALOG


class AdminWorkspaceTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user("admin@example.test", "Test-only-pass123!", first_name="Admin", last_name="User", role="admin")
        cls.staff = User.objects.create_user("staff@example.test", "Test-only-pass123!", first_name="Staff", last_name="User", role="staff")
        cls.student = User.objects.create_user("student@example.test", "Test-only-pass123!", first_name="Student", last_name="User")
        cls.org = Organization.objects.create(name="Test organization", slug="test-org")

    def setUp(self):
        self.client.force_authenticate(self.admin)

    def url(self, path):
        return f"/api/v1/admin/{path}/"

    def test_every_section_schema_and_empty_list_are_valid(self):
        for key in CATALOG:
            with self.subTest(section=key):
                schema = self.client.get(self.url(f"{key}/schema"))
                self.assertEqual(schema.status_code, 200, schema.data)
                names = {field["name"] for field in schema.data["fields"]}
                self.assertTrue(set(schema.data["columns"]) <= names | {"created_at"})
                response = self.client.get(self.url(key))
                self.assertEqual(response.status_code, 200, response.data)
                self.assertIn("results", response.data)
                self.assertEqual(response["Cache-Control"], "no-store")

    def test_anonymous_and_non_staff_cannot_access_workspace(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(self.url("catalog")).status_code, 401)
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get(self.url("catalog")).status_code, 403)
        self.assertEqual(self.client.get(self.url("overview")).status_code, 403)

    def test_staff_catalog_and_endpoints_hide_admin_only_sections(self):
        self.client.force_authenticate(self.staff)
        keys = {item["key"] for item in self.client.get(self.url("catalog")).data}
        self.assertNotIn("users", keys)
        self.assertNotIn("payment-settings", keys)
        for key in ("users", "payment-settings"):
            self.assertEqual(self.client.get(self.url(key)).status_code, 403)
            self.assertEqual(self.client.get(self.url(f"{key}/schema")).status_code, 403)
            self.assertEqual(self.client.post(self.url(key), {}, format="json").status_code, 403)

    def test_program_create_edit_search_and_audit(self):
        response = self.client.post(self.url("programs"), {"organization": str(self.org.pk), "title": "Youth education", "slug": "youth-education", "status": "draft"}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        pk = response.data["id"]
        response = self.client.patch(self.url(f"programs/{pk}"), {"status": "active", "target_beneficiaries": 80}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["_relations"]["organization"], "Test organization")
        results = self.client.get(self.url("programs"), {"search": "Youth", "status": "active"})
        self.assertEqual(results.data["count"], 1)
        self.assertEqual(LogEntry.objects.filter(object_id=pk).count(), 2)

    def test_partial_update_validates_dates_against_existing_values(self):
        program = Program.objects.create(organization=self.org, title="Dates", slug="dates", start_date="2026-10-01", end_date="2026-10-15")
        response = self.client.patch(self.url(f"programs/{program.pk}"), {"end_date": "2026-09-01"}, format="json")
        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn("end_date", response.data)

    def test_project_json_and_funding_fields_persist(self):
        program = Program.objects.create(organization=self.org, title="Evidence", slug="evidence")
        payload = {"program": str(program.pk), "title": "Project", "slug": "project", "evidence_type": "research", "source_year": 2026, "source_documents": ["report.pdf"], "budget": "200.00", "raised_amount": "40.00", "progress_percentage": "20.00"}
        response = self.client.post(self.url("projects"), payload, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Project.objects.get(pk=response.data["id"]).source_documents, ["report.pdf"])
        response = self.client.patch(self.url(f"projects/{response.data['id']}"), {"progress_percentage": "101"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_archive_restore_and_staff_restrictions(self):
        program = Program.objects.create(organization=self.org, title="Archived", slug="archived")
        endpoint = self.url(f"programs/{program.pk}/archive")
        self.client.force_authenticate(self.staff)
        self.assertEqual(self.client.post(endpoint, {}, format="json").status_code, 403)
        self.assertEqual(self.client.get(self.url("programs"), {"archived": "true"}).status_code, 403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(endpoint, {}, format="json").status_code, 200)
        self.assertEqual(self.client.get(self.url("programs")).data["count"], 0)
        self.assertEqual(self.client.get(self.url("programs"), {"archived": "true"}).data["count"], 1)
        self.assertEqual(self.client.post(endpoint, {"restore": True}, format="json").status_code, 200)
        self.assertEqual(self.client.get(self.url("programs")).data["count"], 1)

    def test_transactions_cannot_be_fabricated_or_modified(self):
        donation = Donation.objects.create(amount=20, status="pending")
        self.assertEqual(self.client.post(self.url("donations"), {"amount": "500"}, format="json").status_code, 403)
        self.assertEqual(self.client.patch(self.url(f"donations/{donation.pk}"), {"status": "completed"}, format="json").status_code, 403)
        self.assertEqual(self.client.post(self.url(f"donations/{donation.pk}/archive"), {}, format="json").status_code, 403)

    def test_overview_separates_currencies_and_ignores_pending(self):
        Donation.objects.create(amount=Decimal("10.50"), currency="USD", status="completed")
        Donation.objects.create(amount=5000, currency="XAF", status="completed")
        Donation.objects.create(amount=99, currency="USD", status="pending")
        response = self.client.get(self.url("overview"))
        self.assertEqual(response.status_code, 200, response.data)
        totals = {row["currency"]: Decimal(row["amount"]) for row in response.data["donation_totals"]}
        self.assertEqual(totals, {"USD": Decimal("10.50"), "XAF": Decimal("5000")})
        self.assertEqual(sum(row["count"] for row in response.data["daily_donations"]), 2)

    def test_users_reject_privilege_fields_and_self_lockout(self):
        for payload in ({"is_superuser": True}, {"password": "replacement"}, {"is_active": False}, {"role": "student"}):
            response = self.client.patch(self.url(f"users/{self.admin.pk}"), payload, format="json")
            self.assertEqual(response.status_code, 400, response.data)
        data = self.client.get(self.url("users")).data["results"][0]
        self.assertNotIn("password", data)
        self.assertNotIn("is_superuser", data)

    def test_account_creation_hashes_password_without_returning_it(self):
        payload = {"email": "new@example.test", "first_name": "New", "last_name": "Person", "role": "volunteer", "initial_password": "Only-a-test-password!937"}
        response = self.client.post(self.url("users"), payload, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        account = User.objects.get(email=payload["email"])
        self.assertTrue(account.check_password(payload["initial_password"]))
        self.assertNotIn("initial_password", response.data)
        self.assertFalse(account.is_staff)
        self.assertFalse(account.is_superuser)

    def test_payment_settings_remain_a_singleton(self):
        first = self.client.post(self.url("payment-settings"), {"bank_name": "Test bank"}, format="json")
        self.assertEqual(first.status_code, 201, first.data)
        second = self.client.post(self.url("payment-settings"), {"bank_name": "Other"}, format="json")
        self.assertEqual(second.status_code, 403)
        self.assertEqual(DonationPaymentSettings.objects.count(), 1)

    def test_relation_options_search_and_invalid_sort(self):
        response = self.client.get(self.url("programs/options/organization"), {"search": "Test"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"][0]["value"], str(self.org.pk))
        self.assertEqual(self.client.get(self.url("programs"), {"ordering": "password"}).status_code, 400)
        self.assertEqual(self.client.get(self.url("programs"), {"status": "unknown"}).status_code, 400)
        self.assertEqual(self.client.get(self.url("unknown")).status_code, 404)

    def test_multipart_payload_preserves_json_types_and_nulls(self):
        with override_settings(STORAGES={"default": {"BACKEND": "django.core.files.storage.InMemoryStorage"}, "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"}}):
            payload = {"title": "Research report", "slug": "research-report", "is_active": False, "published_at": None}
            upload = SimpleUploadedFile("report.pdf", b"%PDF-1.4\nTest document", content_type="application/pdf")
            response = self.client.post(self.url("resources"), {"payload": json.dumps(payload), "file": upload}, format="multipart")
            self.assertEqual(response.status_code, 201, response.data)
            self.assertFalse(response.data["is_active"])
            self.assertIsNone(response.data["published_at"])
            self.assertIn(".pdf", response.data["file"])

    def test_staff_cannot_bypass_existing_admin_only_write_rules(self):
        self.client.force_authenticate(self.staff)
        for key in ("organizations", "categories", "event-categories", "partners", "grants"):
            schema = self.client.get(self.url(f"{key}/schema"))
            self.assertFalse(schema.data["permissions"]["edit"])
            self.assertFalse(schema.data["permissions"]["create"])
            self.assertEqual(self.client.post(self.url(key), {}, format="json").status_code, 403)
        response = self.client.patch(self.url(f"organizations/{self.org.pk}"), {"name": "Changed"}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_archiving_parent_requires_handling_active_dependents(self):
        program = Program.objects.create(organization=self.org, title="Parent", slug="parent")
        project = Project.objects.create(program=program, title="Child", slug="child")
        endpoint = self.url(f"programs/{program.pk}/archive")
        self.assertEqual(self.client.post(endpoint, {}, format="json").status_code, 400)
        self.assertEqual(self.client.post(self.url(f"projects/{project.pk}/archive"), {}, format="json").status_code, 200)
        self.assertEqual(self.client.post(endpoint, {}, format="json").status_code, 200)
        self.assertEqual(self.client.post(self.url(f"projects/{project.pk}/archive"), {"restore": True}, format="json").status_code, 400)

    def test_course_rich_text_removes_executable_markup(self):
        from apps.elearning.models import Subject
        subject = Subject.objects.create(name="Education", slug="education")
        response = self.client.post(self.url("courses"), {"subject": str(subject.pk), "title": "Test course", "slug": "test-course", "description": '<p>Lesson</p><script>alert(1)</script><img src="x" onerror="alert(2)">'}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertNotIn("<script>", response.data["description"])
        self.assertNotIn("onerror", response.data["description"])
