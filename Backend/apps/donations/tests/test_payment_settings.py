from django.core.exceptions import ValidationError
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.donations.models import Donation, DonationCampaign, DonationPaymentSettings
from apps.donations.tasks import process_donation_payment


class DonationPaymentSettingsTests(APITestCase):
    def setUp(self):
        self.url = reverse("donation-payment-settings")

    def test_empty_settings_are_public_without_creating_configuration(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["bank_name"], "")
        self.assertEqual(response.data["paypal_url"], "")
        self.assertFalse(DonationPaymentSettings.objects.exists())

    def test_public_settings_return_only_receiving_details(self):
        DonationPaymentSettings.objects.create(
            bank_name="Test Bank", account_name="Test Organization", account_number="TEST-ONLY-123",
            paypal_url="https://www.paypal.com/donate/?hosted_button_id=TEST",
            campay_url="https://campay.net/test-payment-link",
        )
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["account_number"], "TEST-ONLY-123")
        self.assertNotIn("singleton", response.data)
        self.assertNotIn("id", response.data)

    def test_public_cannot_change_receiving_accounts(self):
        response = self.client.post(self.url, {"account_number": "other-account"}, format="json")
        self.assertEqual(response.status_code, 405)
        self.assertFalse(DonationPaymentSettings.objects.exists())

    def test_payment_links_require_https(self):
        for url in ("http://paypal.com/donate", "javascript:alert(1)"):
            with self.assertRaises(ValidationError):
                DonationPaymentSettings(paypal_url=url).full_clean()

    def test_unverified_payment_stays_pending_without_inflating_campaign(self):
        campaign = DonationCampaign.objects.create(title="Test campaign", slug="test-campaign", goal_amount=100)
        donation = Donation.objects.create(campaign=campaign, amount=10, gateway="paypal")
        process_donation_payment.func(str(donation.id))
        donation.refresh_from_db()
        campaign.refresh_from_db()
        self.assertEqual(donation.status, "pending")
        self.assertFalse(donation.receipt_sent)
        self.assertEqual(campaign.raised_amount, 0)
