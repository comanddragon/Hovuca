from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DonorOrganizationViewSet,
    DonorContactViewSet,
    GrantViewSet,
    DonorEngagementViewSet,
    DonorSummaryView,
)

app_name = "donors"

router = DefaultRouter()
router.register("organizations", DonorOrganizationViewSet, basename="donor-organization")
router.register(r"contacts", DonorContactViewSet, basename="donor-contact")
router.register(r"grants", GrantViewSet, basename="grant")
router.register(r"engagements", DonorEngagementViewSet, basename="donor-engagement")

urlpatterns = [
    path("summary/", DonorSummaryView.as_view(), name="donor-summary"),
    path("donors/", include(router.urls)),
]