"""
One-time backfill: convert every existing jpg/jpeg/png ImageField file
already stored (e.g. on R2) to WebP, across all installed apps.

New uploads are already converted automatically by BaseModel.save();
this command only needs to be run once for images that predate that change.
"""

from django.apps import apps
from django.core.management.base import BaseCommand
from django.db import models

from core.utils.images import to_webp


class Command(BaseCommand):
    help = "Convert existing jpg/jpeg/png images on every model to WebP."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        converted = skipped = failed = 0

        for model in apps.get_models():
            image_fields = [
                f for f in model._meta.get_fields() if isinstance(f, models.ImageField)
            ]
            if not image_fields:
                continue

            for field in image_fields:
                queryset = model._default_manager.exclude(**{f"{field.name}__in": ["", None]})
                for instance in queryset.iterator():
                    field_file = getattr(instance, field.name)
                    if not field_file or "." not in field_file.name:
                        continue
                    ext = field_file.name.rsplit(".", 1)[-1].lower()
                    if ext not in ("jpg", "jpeg", "png"):
                        skipped += 1
                        continue

                    label = f"{model.__module__}.{model.__name__}({instance.pk}).{field.name}"
                    try:
                        old_name = field_file.name
                        field_file.open("rb")
                        result = to_webp(field_file.file)
                        field_file.close()
                        if result is None:
                            skipped += 1
                            continue
                        content, new_name = result

                        if dry_run:
                            self.stdout.write(f"Would convert: {label} ({old_name})")
                        else:
                            field_file.save(new_name, content, save=False)
                            instance.save(update_fields=[field.name])
                            field_file.storage.delete(old_name)
                            self.stdout.write(f"Converted: {label}")
                        converted += 1
                    except Exception as exc:  # noqa: BLE001
                        failed += 1
                        self.stderr.write(f"Failed: {label}: {exc}")

        suffix = " (dry run)" if dry_run else ""
        self.stdout.write(
            self.style.SUCCESS(
                f"{converted} converted, {skipped} skipped, {failed} failed{suffix}"
            )
        )
