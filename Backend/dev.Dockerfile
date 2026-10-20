FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo \
    zlib1g \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/ requirements/

# Cache downloaded wheels between builds.
RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install \
    --timeout 120 \
    --retries 10 \
    -r requirements/development.txt

COPY . .

ENV DJANGO_SETTINGS_MODULE=config.settings.development

# Doesn't require the development database to exist during image build.
RUN DJANGO_SECRET_KEY=dev-secret-key-for-collectstatic \
    python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]