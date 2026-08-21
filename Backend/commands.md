python manage.py migrate
python manage.py setup_alert_schedules
celery -A config worker -l info
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
celery -A config purge


Want me to wire it in? I'd add Fraunces via next/font/google, set it as --font-display in globals.css, and swap the font-display class references over — that's the actual mechanism driving your headings right now.

If the goal is to add a serif for warmth/trust (common for NGOs — think editorial, humanitarian storytelling), I'd look at something like Lora, Source Serif 4, or Fraunces for headings only, keeping Poppins for UI/body text. That gets you the "considered, editorial" feel without the dated-document connotation.