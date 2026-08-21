"""
Celery application instance for ngo_platform.

Usage:
    celery -A config worker -l info
    celery -A config beat -l info
    celery -A config flower                  # monitoring UI
"""

import os

from celery import Celery
from celery.signals import setup_logging

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("hovuca")

# Read config from Django settings, namespace all Celery keys with CELERY_
app.config_from_object("django.conf:settings", namespace="CELERY")
# app.conf.worker_concurrency = 1
# app.conf.worker_pool = "solo"

# Suppress Celery's default logging so Django's LOGGING config takes full control
@setup_logging.connect
def config_loggers(*args, **kwargs):
    from logging.config import dictConfig
    from django.conf import settings

    dictConfig(settings.LOGGING)


# Auto-discover tasks.py in every INSTALLED_APP
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f"Request: {self.request!r}")
