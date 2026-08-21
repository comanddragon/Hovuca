from django.urls import path, include

# api/v1/urls.py
urlpatterns = [
    path("auth/", include("apps.accounts.api.urls")),        # auth/, users/
    path("", include("apps.organization.api.urls")),
    path("", include("apps.programs.api.urls")),
    path("", include("apps.volunteers.api.urls")),
    path("", include("apps.donations.api.urls")),
    path("", include("apps.elearning.api.urls")),
    path("", include("apps.blogs.api.urls")),
    path("", include("apps.events.api.urls")),
    path("", include("apps.gallery.api.urls")),
    path("", include("apps.donors.api.urls")),
    path("", include("apps.notifications.api.urls")),
]