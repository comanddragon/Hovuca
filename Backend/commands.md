python manage.py migrate
python manage.py setup_alert_schedules
celery -A config worker -l info
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
celery -A config purge


I want you to wire and add Fraunces via next/font/google, set it as --font-display in globals.css, and swap the font-display class references over, that's the actual mechanism driving your headings right now.
Keeping Poppins for UI/body font.

