# This makes the Celery app available when Django starts,
# so shared_task decorators can reference it correctly.
from .celery import app as celery_app

__all__ = ("celery_app",)
