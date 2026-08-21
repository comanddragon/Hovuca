from rest_framework.routers import DefaultRouter
from .views import EventViewSet, EventCategoryViewSet
from django.urls import path, include


router = DefaultRouter()
router.register("categories", EventCategoryViewSet, basename="event-category")
router.register("events", EventViewSet, basename="event")

urlpatterns = [
    path("", include(router.urls)),
]