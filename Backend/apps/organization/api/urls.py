from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import OrganizationViewSet, BranchViewSet, DepartmentViewSet
from .views import ContactMessageCreateView

router = DefaultRouter()
router.register("organizations", OrganizationViewSet, basename="organization")
router.register("branches", BranchViewSet, basename="branch")
router.register("departments", DepartmentViewSet, basename="department")

urlpatterns = [
    path("contact-messages/", ContactMessageCreateView.as_view(), name="contact-message-create"),
    path("", include(router.urls)),
]
