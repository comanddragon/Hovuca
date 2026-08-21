from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ProgramViewSet, ProjectViewSet

router = DefaultRouter()
router.register("programs", ProgramViewSet, basename="program")
router.register("projects", ProjectViewSet, basename="project")

urlpatterns = [
    path("", include(router.urls)),
]
