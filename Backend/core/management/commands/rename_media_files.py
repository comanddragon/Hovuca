"""Rename model-backed media using each field's current upload naming policy."""

import hashlib
from collections import Counter
from pathlib import Path

from django.apps import apps
from django.core.files import File
from django.core.management.base import BaseCommand
from django.db import models


def file_digest(storage, name: str) -> str:
    digest = hashlib.sha256()
    with storage.open(name, "rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


class Command(BaseCommand):
    help = "Rename existing FileField/ImageField objects after their parent records."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument(
            "--keep-old",
            action="store_true",
            help="Keep source objects after database references move to the new names.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        keep_old = options["keep_old"]
        entries = []
        references = Counter()

        for model in apps.get_models():
            fields = [
                field
                for field in model._meta.get_fields()
                if isinstance(field, models.FileField)
            ]
            for field in fields:
                queryset = model._base_manager.exclude(
                    **{f"{field.name}__in": ["", None]}
                )
                for instance in queryset.iterator():
                    field_file = getattr(instance, field.name)
                    if not field_file:
                        continue
                    references[(id(field_file.storage), field_file.name)] += 1
                    entries.append((model, field, instance, field_file.storage, field_file.name))

        renamed = unchanged = missing = conflicts = failed = 0
        old_candidates = {}

        for model, field, instance, storage, old_name in entries:
            desired_name = field.generate_filename(instance, Path(old_name).name)
            label = f"{model._meta.label}({instance.pk}).{field.name}"
            if desired_name == old_name:
                unchanged += 1
                continue

            if dry_run:
                self.stdout.write(f"Would rename: {old_name} -> {desired_name}")
                renamed += 1
                continue

            try:
                if not storage.exists(old_name):
                    self.stderr.write(f"Missing: {label}: {old_name}")
                    missing += 1
                    continue

                if storage.exists(desired_name):
                    if file_digest(storage, old_name) != file_digest(storage, desired_name):
                        self.stderr.write(
                            f"Conflict: {label}: destination already differs: {desired_name}"
                        )
                        conflicts += 1
                        continue
                else:
                    with storage.open(old_name, "rb") as source:
                        saved_name = storage.save(desired_name, File(source))
                    if saved_name != desired_name:
                        storage.delete(saved_name)
                        self.stderr.write(
                            f"Conflict: {label}: storage would rename destination to {saved_name}"
                        )
                        conflicts += 1
                        continue

                model._base_manager.filter(pk=instance.pk).update(
                    **{field.name: desired_name}
                )
                storage_key = id(storage)
                references[(storage_key, old_name)] -= 1
                references[(storage_key, desired_name)] += 1
                old_candidates[(storage_key, old_name)] = storage
                renamed += 1
                self.stdout.write(f"Renamed: {old_name} -> {desired_name}")
            except Exception as exc:  # noqa: BLE001
                failed += 1
                self.stderr.write(f"Failed: {label}: {exc}")

        deleted = 0
        if not dry_run and not keep_old:
            for key, storage in old_candidates.items():
                _, old_name = key
                if references[key] == 0 and storage.exists(old_name):
                    storage.delete(old_name)
                    deleted += 1

        suffix = " (dry run)" if dry_run else ""
        self.stdout.write(
            self.style.SUCCESS(
                f"{renamed} renamed, {unchanged} already named, {deleted} old objects "
                f"deleted, {missing} missing, {conflicts} conflicts, {failed} failed{suffix}"
            )
        )
