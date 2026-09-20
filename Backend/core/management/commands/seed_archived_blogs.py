from __future__ import annotations

import csv
import json
import logging
import mimetypes
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.utils.text import slugify
from lxml import html

from apps.accounts.models import User
from apps.blogs.importing import ARCHIVE_PREFIX
from apps.blogs.models import Article, Category, Tag
from apps.programs.models import Topic
import re

MEDIA_URL_PREFIX = "/media/"

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Idempotently seed blog articles exported by scrape_archived_blogs."

    def add_arguments(self, parser):
        project_root = Path(__file__).resolve().parents[4]
        parser.add_argument("--csv", type=Path, default=project_root / "Backend" / "data" / "archived_blogs.csv")
        parser.add_argument("--archive-root", type=Path, default=project_root / "hovuca.org")
        parser.add_argument("--author-email", default="content@hovuca.org")
        parser.add_argument("--status", choices=[choice for choice, _ in Article.Status.choices], default=Article.Status.PUBLISHED)
        parser.add_argument("--dry-run", action="store_true")

    @staticmethod
    def _date(value: str):
        parsed = parse_datetime(value) if value else None
        if parsed and timezone.is_naive(parsed):
            parsed = timezone.make_aware(parsed)
        return parsed

    @staticmethod
    def _asset_path(archive_root: Path, value: str) -> Path | None:
        if not value:
            return None
        path = (archive_root / value).resolve()
        try:
            path.relative_to(archive_root.resolve())
        except ValueError:
            return None
        return path if path.is_file() else None

    def _import_body_images(self, body_html: str, archive_root: Path, slug: str, dry_run: bool = False) -> str:
        # Self-heal previously-imported inline images whose src is missing the
        # MEDIA_URL prefix (e.g. saved before a storage/URL config fix).
        body_html = re.sub(
            r'(<img\b[^>]*\bsrc=["\'])(?!https?://|/media/|data:)(/?blog/inline/imported/)',
            rf"\1{MEDIA_URL_PREFIX}\2",
            body_html,
        )

        if ARCHIVE_PREFIX not in body_html:
            return body_html
        wrapper = html.fragment_fromstring(body_html, create_parent="div")
        for index, image in enumerate(wrapper.xpath(f'.//img[starts-with(@src, "{ARCHIVE_PREFIX}")]'), start=1):
            relative = image.get("src", "")[len(ARCHIVE_PREFIX):]
            source = self._asset_path(archive_root, relative)
            if source is None:
                logger.warning("Inline image not found, dropping: %s (article=%s)", relative, slug)
                image.drop_tree()
                continue
            suffix = source.suffix.lower() or mimetypes.guess_extension(
                mimetypes.guess_type(source.name)[0] or "") or ".jpg"
            storage_name = f"blog/inline/imported/{slug}-{index}{suffix}"
            from django.core.files.storage import default_storage
            if not dry_run and not default_storage.exists(storage_name):
                with source.open("rb") as source_file:
                    default_storage.save(storage_name, File(source_file))
                logger.debug("Saved inline image: %s", storage_name)
            image.set("src", default_storage.url(storage_name) if not dry_run else source.as_uri())
        return "".join(html.tostring(child, encoding="unicode", method="html") for child in wrapper)

    def handle(self, *args, **options):
        csv_path: Path = options["csv"].resolve()
        archive_root: Path = options["archive_root"].resolve()
        if not csv_path.is_file():
            raise CommandError(f"CSV file not found: {csv_path}. Run scrape_archived_blogs first.")
        if not archive_root.is_dir():
            raise CommandError(f"Archive directory not found: {archive_root}")

        logger.info("Seeding articles from %s (dry_run=%s)", csv_path, options["dry_run"])

        author, author_created = User.objects.get_or_create(
            email=options["author_email"],
            defaults={"first_name": "HOVUCA", "last_name": "Team", "role": User.Role.STAFF, "is_staff": True, "is_active": True, "is_email_verified": True},
        )
        logger.info("%s author: %s", "Created" if author_created else "Using existing", author.email)

        created = updated = covers_uploaded = 0

        with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file, transaction.atomic():
            for row in csv.DictReader(csv_file):
                logger.debug("Processing row: slug=%s title=%s", row["slug"], row["title"])
                category_name = row.get("category", "").strip() or "News"
                category = Category.objects.filter(name=category_name[:100]).first()
                if category is None:
                    category, category_created = Category.objects.get_or_create(
                        slug=slugify(category_name)[:100],
                        defaults={
                            "name": category_name[:100],
                            "color": "#183B35",
                            "is_active": True,
                        },
                    )
                    if category_created:
                        logger.info("Created category: %s", category.name)

                slug = slugify(row["slug"] or row["title"])[:280]
                body = self._import_body_images(row.get("body_html", ""), archive_root, slug, options["dry_run"])
                published_at = self._date(row.get("published_at", ""))
                article, was_created = Article.objects.update_or_create(
                    slug=slug,
                    defaults={
                        "author": author,
                        "category": category,
                        "title": row["title"][:255],
                        "excerpt": row.get("excerpt", "")[:500],
                        "body": body or f"<p>{row.get('excerpt', '')}</p>",
                        "cover_image_alt": row.get("cover_image_alt", "")[:255],
                        "status": options["status"],
                        "published_at": published_at if options["status"] == Article.Status.PUBLISHED else None,
                        "meta_title": row["title"][:70],
                        "meta_description": row.get("excerpt", "")[:160],
                    },
                )
                logger.info("%s article: %s", "Created" if was_created else "Updated", article.slug)

                tag_names = json.loads(row.get("tags") or "[]")
                article.tags.set(Tag.objects.get_or_create(slug=slugify(name)[:60], defaults={"name": name[:60]})[0] for name in tag_names if name)
                topic_slugs = json.loads(row.get("topic_slugs") or "[]")
                matched_topics = Topic.objects.filter(slug__in=topic_slugs)
                article.topics.set(matched_topics)
                if len(matched_topics) != len(topic_slugs):
                    logger.warning(
                        "Some topic slugs did not match for %s: expected %s, matched %s",
                        slug, topic_slugs, list(matched_topics.values_list("slug", flat=True)),
                    )

                cover_source = self._asset_path(archive_root, row.get("cover_image_path", ""))
                if cover_source and not article.cover_image and not options["dry_run"]:
                    with cover_source.open("rb") as cover_file:
                        article.cover_image.save(f"{slug}{cover_source.suffix.lower()}", File(cover_file), save=True)
                    covers_uploaded += 1
                    logger.info("Uploaded cover image for %s: %s", slug, cover_source.name)
                elif row.get("cover_image_path") and not cover_source:
                    logger.warning("Cover image not found for %s: %s", slug, row.get("cover_image_path"))

                created += int(was_created)
                updated += int(not was_created)

            if options["dry_run"]:
                transaction.set_rollback(True)
                logger.info("Dry run complete, rolling back transaction")

        result = f"{created} created, {updated} updated from {csv_path}"
        if options["dry_run"]:
            result += " (dry run; database changes rolled back)"
        logger.info("Done: %d created, %d updated, %d covers uploaded", created, updated, covers_uploaded)
        self.stdout.write(self.style.SUCCESS(result))