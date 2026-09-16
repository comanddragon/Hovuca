from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import DonationCampaignViewSet, DonationViewSet, DonationPaymentSettingsView

router = DefaultRouter()
router.register("campaigns", DonationCampaignViewSet, basename="campaign")
router.register("donations", DonationViewSet, basename="donation")

urlpatterns = [
    path("donation-payment-settings/", DonationPaymentSettingsView.as_view(), name="donation-payment-settings"),
    path("", include(router.urls)),
]
