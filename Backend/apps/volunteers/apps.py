from django.apps import AppConfig


class VolunteersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.volunteers"
    verbose_name = "Volunteers"

    def ready(self):
        import apps.volunteers.signals  # noqa: F401
