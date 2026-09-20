# Data import tools

All executable HOVUCA seeders, archive scrapers, and seed-data utilities live
in this directory and are exposed as Django management commands.

From `Backend/`, run:

```bash
python manage.py data_tools
python manage.py <command> --help
```

Media maintenance is storage-independent, so the same command works against
local files in development and Cloudflare R2 in production:

```bash
python manage.py rename_media_files --dry-run
python manage.py rename_media_files
```

Before copying a database whose media is already hosted by Cloudflare, verify
that every referenced object exists without modifying the bucket:

```bash
python manage.py audit_r2_media --upload-missing --fail-on-missing
```

The guarded `Backend/scripts/copy_local_db_to_remote.sh` script performs this
check automatically, uploads only missing objects, creates a remote database
backup, and never overwrites or deletes existing R2 objects.

Typical archive workflow:

```bash
python manage.py scrape_archived_topics
python manage.py scrape_archived_blogs
python manage.py scrape_archived_resources
python manage.py scrape_archived_donors

python manage.py seed_archived_topics --dry-run
python manage.py seed_archived_blogs --dry-run
python manage.py seed_archived_resources --dry-run
python manage.py seed_archived_donors --dry-run
```

Production seeding is intentionally guarded and runs all idempotent seeders in
dependency order:

```bash
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py seed_production
```

The parser libraries remain in their owning apps (`apps.blogs.importing`,
`apps.donors.importing`, and `apps.programs.importing`) because they are domain
code, not executable entry points. CSE source documents and generated assets
remain in `Backend/scripts/course/`; the runnable CSE importer is the
`seed_cse_course` command here. All generated and archived CSV files live in
`Backend/data/`.
