# Frontend administration

The Next.js workspace is available at `/admin`. It uses `/api/admin/` through
the existing Next.js gateway, which forwards authenticated requests to Django's
`/api/v1/admin/` endpoints. Set the frontend server's `API_URL` to the backend
API base URL, for example `http://127.0.0.1:8000/api/v1` in development.

## Workflows

- Overview shows incoming review queues, records, completed donations by
  currency for the last 30 days, and the signed-in user's recent admin changes.
- Reports show the same live totals plus daily completed transaction counts.
- Section lists support search, choice/boolean filters, sorting, pagination,
  page CSV export, detail editing, uploads, and archive/restore where available.
- Relationship fields have searchable, paginated selectors; records use UUIDs
  so changing a slug does not invalidate editor links.
- Editors support text, rich text, choices, booleans, dates, decimal numbers,
  JSON evidence/metadata, related records, and files. Server validation is
  shown beside the field. File uploads retain JSON types and nullable values.
- Articles retain the existing dedicated editorial editor. Review queue links
  apply the review filter and article saves invalidate overview data.
- New user accounts require an initial password validated by Django. Passwords
  are hashed and never returned. Credential changes use the existing password
  reset/account settings flow.

## Access and integrity

Only active staff, administrators, or superusers can use the API. The frontend
guard verifies access with Django rather than trusting a persisted profile.
User management and payment settings require an administrator. Existing admin
write restrictions for organizations, categories, partners, grants, and
volunteer profiles are preserved; staff see those sections as read-only.

Donation transactions, enrollments, and quiz results are read-only. This panel
does not execute payments, refunds, certificate issuance, or change exam scores.
Public payment receiving details are a singleton. Files are limited to 25 MB;
executable files, scripts, HTML and SVG uploads are rejected.

Archive and restore require an administrator and use the existing soft-delete
fields. A parent with active dependent records cannot be archived; archive its
dependents first. Restore the parent before restoring a child. Changes are
recorded in Django's admin history without storing passwords or field values.

## Authentication

The browser uses same-origin `/api` requests. The Next.js gateway stores the
SimpleJWT access and refresh tokens in HttpOnly cookies, sets Secure cookies in
production and SameSite=Lax, strips tokens from authentication responses, and
rejects cross-site mutation requests. The browser never receives token values.
The frontend persists a profile for display only, not JWT credentials.

## Verification

From `Backend`, run:

```text
.venv\Scripts\python.exe manage.py test core.tests.test_admin_api core.tests.test_admin_dashboard core.tests.test_admin_previews apps.accounts.tests.test_security apps.donations.tests.test_payment_settings --settings=config.settings.tests --noinput
```

From `frontend`, run the TypeScript check, ESLint on changed files, and the
production build. A separate local preview may use `NEXT_DIST_DIR` to avoid
colliding with an existing Next.js development server's output directory.
