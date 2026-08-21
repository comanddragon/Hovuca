# HOVUCA NGO Platform

A full-stack Django REST API powering the HOVUCA NGO platform — covering e-learning, volunteer management, donations, real-time notifications, a blog, and more.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Django 5.x + Django REST Framework |
| Auth | `djangorestframework-simplejwt` (JWT) |
| Real-time | Django Channels 4.x + Daphne (ASGI) |
| Channel Layer | Redis (`channels-redis`) |
| Task Queue | Celery + Redis broker |
| Database | PostgreSQL 16 |
| Storage | `django-storages` + AWS S3 (production) |
| API Docs | `drf-spectacular` (OpenAPI 3 / Swagger) |
| Containerisation | Docker + Docker Compose |

---

## Project Structure

```
ngo_platform/
├── config/                  # Django settings, ASGI/WSGI, Celery, root URLs
│   └── settings/
│       ├── base.py          # Shared settings
│       ├── development.py   # Dev overrides (eager Celery, console email, etc.)
│       ├── production.py    # Production (S3, Redis cache, Sentry, HSTS)
│       └── testing.py       # Test suite (SQLite in-memory, no external services)
├── apps/
│   ├── core/                # BaseModel, permissions, pagination, exceptions, utils
│   ├── accounts/            # Custom User model, JWT auth, registration
│   ├── organization/        # NGO profile, branches, departments
│   ├── programs/            # Programs & projects
│   ├── volunteers/          # Volunteer profiles & task management
│   ├── donations/           # Campaigns & payment processing
│   ├── elearning/           # Courses, modules, chapters, quizzes, enrollments
│   ├── blog/                # Articles, comments, likes, bookmarks
│   ├── notifications/       # In-app notifications
│   └── realtime/            # Django Channels WebSocket consumers
├── api/v1/urls.py           # API v1 URL dispatcher
├── templates/emails/        # Transactional email HTML templates
├── scripts/
│   ├── entrypoint.sh        # Docker entrypoint (migrations, static, superuser)
│   └── seed_data.py         # Development seed data management command
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
└── .env.example
```

---

## Quick Start

### 1. Clone & configure

```bash
git clone https://github.com/your-org/hovuca.git
cd hovuca/ngo_platform
cp .env.example .env
# Edit .env with your local values
```

### 2. Run with Docker (recommended)

```bash
cd docker
docker-compose up --build
```

This starts: Django (Daphne ASGI on :8000), PostgreSQL, Redis, Celery worker, Celery beat.

### 3. Run locally without Docker

```bash
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements/development.txt

# Set up the database (PostgreSQL must be running)
python manage.py migrate

# Create a superuser
python manage.py createsuperuser

# Seed development data
python manage.py seed_data

# Start the development server
python manage.py runserver

# In separate terminals:
celery -A config worker -l info -Q default,accounts,payments,certificates
celery -A config beat   -l info
```

---

## API

| Base URL | Description |
|---|---|
| `http://localhost:8000/api/v1/` | REST API |
| `http://localhost:8000/api/docs/` | Swagger UI |
| `http://localhost:8000/api/redoc/` | ReDoc |
| `http://localhost:8000/admin/` | Django Admin |

### Authentication

All protected endpoints require a Bearer JWT in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Obtain tokens:

```bash
POST /api/v1/auth/login/
{ "email": "admin@hovuca.org", "password": "password123" }
```

---

## WebSocket Endpoints

| URL | Consumer | Description |
|---|---|---|
| `ws://host/ws/notifications/?token=<jwt>` | `NotificationConsumer` | Personal notification stream |
| `ws://host/ws/chat/<room_id>/?token=<jwt>` | `ChatConsumer` | Live chat room |
| `ws://host/ws/quiz/<quiz_id>/?token=<jwt>` | `QuizConsumer` | Live quiz leaderboard |

---

## API Endpoints Summary

### Auth
| Method | URL | Description |
|---|---|---|
| POST | `/api/v1/auth/register/` | Register new user |
| POST | `/api/v1/auth/login/` | Obtain JWT tokens |
| POST | `/api/v1/auth/logout/` | Blacklist refresh token |
| GET/PATCH | `/api/v1/auth/me/` | Own profile |
| POST | `/api/v1/auth/change-password/` | Change password |

### E-Learning
| Method | URL | Description |
|---|---|---|
| GET | `/api/v1/elearning/courses/` | List published courses |
| POST | `/api/v1/elearning/courses/{slug}/enroll/` | Enroll in a course |
| POST | `/api/v1/elearning/chapters/{id}/complete/` | Mark chapter done |
| POST | `/api/v1/elearning/quizzes/{id}/submit/` | Submit quiz answers |
| GET | `/api/v1/elearning/quizzes/{id}/leaderboard/` | Quiz top 10 |
| GET | `/api/v1/elearning/enrollments/my-courses/` | Student dashboard |

### Blog
| Method | URL | Description |
|---|---|---|
| GET | `/api/v1/blog/articles/` | List published articles |
| GET | `/api/v1/blog/articles/featured/` | Featured articles |
| POST | `/api/v1/blog/articles/{slug}/like/` | Toggle like |
| POST | `/api/v1/blog/articles/{slug}/bookmark/` | Toggle bookmark |
| POST | `/api/v1/blog/comments/` | Post a comment |

### Donations
| Method | URL | Description |
|---|---|---|
| GET | `/api/v1/campaigns/` | List active campaigns |
| POST | `/api/v1/donations/` | Make a donation |
| GET | `/api/v1/donations/summary/` | Donation stats (staff) |

---

## Environment Variables

See `.env.example` for the full reference. Key variables:

```env
SECRET_KEY=...
DEBUG=True
DB_NAME=hovuca_db
DB_USER=hovuca_user
DB_PASSWORD=...
DB_HOST=localhost
REDIS_URL=redis://localhost:6379/0
```

---

## Running Tests

```bash
# Run the full test suite
pytest

# With coverage
pytest --cov=apps --cov-report=html

# Run a specific app
pytest apps/elearning/tests/ -v

# Run in parallel
pytest -n auto
```

---

## Celery Tasks

| Task | Queue | Trigger |
|---|---|---|
| `accounts.send_welcome_email` | emails | User registration |
| `elearning.generate_certificate` | certificates | Course completion |
| `elearning.notify_quiz_leaderboard_update` | default | Quiz submitted |
| `donations.process_donation_payment` | payments | Donation created |
| `donations.send_donation_receipt` | emails | Payment confirmed |
| `volunteers.remind_pending_tasks` | default | Celery Beat (daily) |
| `notifications.send_notification` | default | Various signals |
| `blog.send_article_published_newsletter` | emails | Article published |

---

## Code Quality

```bash
# Lint + format with Ruff
ruff check .
ruff format .

# Type checking
mypy apps/
```

---

## License

Proprietary — © HOVUCA. All rights reserved.