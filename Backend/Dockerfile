FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo \
    zlib1g \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies first (better layer caching)
COPY requirements/ requirements/
RUN pip install --no-cache-dir -r requirements/production.txt && pip install --upgrade pip

# Copy application code
COPY . .

# Set environment
ENV DJANGO_SETTINGS_MODULE=config.settings.production

# Collect static files
RUN DJANGO_SECRET_KEY=collectstatic-only-not-a-runtime-secret-0000000000000000 \
    ALLOWED_HOSTS=localhost \
    NEON_DB_URL=postgresql://build:build@localhost:5432/build \
    CORS_ALLOWED_ORIGINS=http://localhost:3000 \
    R2_ACCOUNT_ID=collectstatic \
    R2_ACCESS_KEY_ID=collectstatic \
    R2_SECRET_ACCESS_KEY=collectstatic \
    R2_BUCKET_NAME=collectstatic \
    R2_PUBLIC_URL=https://example.invalid \
    SENTRY_DSN= \
    python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000

# Run migrations and start gunicorn
CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers ${WEB_CONCURRENCY:-1} --threads 2 --timeout 120 --access-logfile -"]