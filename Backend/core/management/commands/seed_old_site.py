import json
from datetime import datetime
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = "Seed blog articles and downloadable resources recovered from the old HOVUCA website."

    def handle(self, *args, **options):
        from apps.accounts.models import User
        from apps.blogs.models import Article, Category, Resource

        assets_dir = Path(__file__).resolve().parent / "seed_assets"
        manifest_path = assets_dir / "old_site_content.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

        author = User.objects.filter(role=User.Role.STAFF).first()
        if author is None:
            author = User.objects.create_user(
                email="content@hovuca.org",
                password=None,
                first_name="HOVUCA",
                last_name="Team",
                role=User.Role.STAFF,
                is_staff=True,
                is_active=True,
                is_email_verified=True,
            )

        category_cache = {}
        article_count = 0
        for item in manifest["articles"]:
            category_name = item.get("category") or "News"
            category = category_cache.get(category_name)
            if category is None:
                category, _ = Category.objects.get_or_create(
                    slug=item.get("category_slug") or "news",
                    defaults={"name": category_name, "color": "#2563EB", "is_active": True},
                )
                category_cache[category_name] = category

            published_at = timezone.make_aware(datetime.fromisoformat(item["published_at"]))
            Article.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "author": author,
                    "category": category,
                    "title": item["title"],
                    "excerpt": item["excerpt"][:500],
                    "body": item["body"],
                    "status": Article.Status.PUBLISHED,
                    "published_at": published_at,
                    "is_featured": item.get("is_featured", False),
                    "meta_title": item["title"][:70],
                    "meta_description": item["excerpt"][:160],
                },
            )
            article_count += 1

        resource_count = 0
        for item in manifest["resources"]:
            resource, _ = Resource.objects.get_or_create(
                slug=item["slug"],
                defaults={
                    "title": item["title"],
                    "description": item["description"],
                    "category": item["category"],
                    "published_at": timezone.make_aware(datetime.fromisoformat(item["published_at"])),
                    "is_active": True,
                },
            )
            if not resource.file:
                source = assets_dir / "documents" / item["asset_name"]
                with source.open("rb") as source_file:
                    resource.file.save(item["asset_name"], File(source_file), save=True)
            resource_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {article_count} old-site articles and {resource_count} resources."
        ))
