python manage.py migrate
python manage.py setup_alert_schedules
celery -A config worker -l info
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
celery -A config purge