from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from apps.organization.models import Organization
from apps.donors.models import DonorOrganization


class OrganizationDonorIntegrationTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            email="testadmin@example.com",
            password="password123",
            role="admin",
        )
        self.client.force_authenticate(self.user)

        self.org1 = Organization.objects.create(
            name="HOVUCA Test Org 1",
            slug="hovuca-test-1",
        )
        self.org2 = Organization.objects.create(
            name="Other Test Org 2",
            slug="other-test-2",
        )
        self.donor1 = DonorOrganization.objects.create(
            organization=self.org1,
            name="Donor One",
            slug="donor-one",
            total_funded=50000,
        )
        self.donor2 = DonorOrganization.objects.create(
            organization=self.org1,
            name="Donor Two",
            slug="donor-two",
            total_funded=10000,
        )
        self.donor3 = DonorOrganization.objects.create(
            organization=self.org2,
            name="Donor Three",
            slug="donor-three",
            total_funded=5000,
        )

    def test_organization_list_includes_donor_count(self):
        url = reverse("organization-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        results = response.data["results"]
        org1_data = next(o for o in results if o["id"] == str(self.org1.id))
        org2_data = next(o for o in results if o["id"] == str(self.org2.id))
        self.assertEqual(org1_data["donor_count"], 2)
        self.assertEqual(org2_data["donor_count"], 1)

    def test_organization_detail_includes_donor_count(self):
        url = reverse("organization-detail", args=[self.org1.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["donor_count"], 2)

    def test_organization_donors_action(self):
        url = reverse("organization-donors", args=[self.org1.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        results = response.data["results"]
        self.assertEqual(len(results), 2)
        donor_names = {d["name"] for d in results}
        self.assertEqual(donor_names, {"Donor One", "Donor Two"})

    def test_donor_organization_filter_by_org_id(self):
        url = reverse("donors:donor-organization-list")
        response = self.client.get(url, {"organization": str(self.org1.id)})
        self.assertEqual(response.status_code, 200)
        results = response.data["results"]
        self.assertEqual(len(results), 2)

    def test_donor_organization_filter_by_org_slug(self):
        url = reverse("donors:donor-organization-list")
        response = self.client.get(url, {"organization": self.org2.slug})
        self.assertEqual(response.status_code, 200)
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Donor Three")
