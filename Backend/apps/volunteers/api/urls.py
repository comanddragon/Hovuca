from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import VolunteerProfileViewSet, VolunteerTaskViewSet

router = DefaultRouter()
router.register("volunteers", VolunteerProfileViewSet, basename="volunteer")
router.register("volunteer-tasks", VolunteerTaskViewSet, basename="volunteer-task")

urlpatterns = [
    path("", include(router.urls)),
]
