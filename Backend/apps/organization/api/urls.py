from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import OrganizationViewSet, BranchViewSet, DepartmentViewSet

router = DefaultRouter()
router.register("organizations", OrganizationViewSet, basename="organization")
router.register("branches", BranchViewSet, basename="branch")
router.register("departments", DepartmentViewSet, basename="department")

urlpatterns = [
    path("", include(router.urls)),
]
