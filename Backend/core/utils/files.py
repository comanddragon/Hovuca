"""
File and upload utility helpers.
"""

import os
import uuid
from pathlib import Path

from django.utils.deconstruct import deconstructible
from django.utils.text import slugify


def media_object_stem(instance) -> str:
    """Return a stable, human-readable filename stem for a model instance."""
    for attribute in ("slug", "title", "name", "reference_code", "email"):
        value = getattr(instance, attribute, "")
        if value:
            stem = slugify(str(value))
            if stem:
                return stem[:100]

    for relation in ("event", "album", "course", "module", "donor_organization"):
        parent = getattr(instance, relation, None)
        if parent is not None:
            stem = media_object_stem(parent)
            if stem:
                return stem

    return instance._meta.model_name


@deconstructible
class ParentNamedUploadPath:
    """Build collision-resistant paths named after the owning object."""

    def __init__(self, subfolder: str, label: str):
        self.subfolder = subfolder.strip("/")
        self.label = slugify(label) or "media"

    def __call__(self, instance, filename: str) -> str:
        extension = Path(filename).suffix.lower()
        object_id = str(getattr(instance, "pk", "") or uuid.uuid4()).replace("-", "")[:8]
        suffix = f"-{self.label}-{object_id}{extension}"
        # FileField defaults to max_length=100. Keep the complete storage key
        # within that limit while retaining the identifying suffix.
        stem_limit = max(1, 100 - len(self.subfolder) - 1 - len(suffix))
        stem = media_object_stem(instance)[:stem_limit].rstrip("-") or "media"
        filename = f"{stem}{suffix}"
        return os.path.join(self.subfolder, filename)


def parent_named_upload_path(subfolder: str, label: str):
    return ParentNamedUploadPath(subfolder, label)


def unique_upload_path(subfolder: str):
    """
    Returns a callable suitable for model FileField/ImageField `upload_to`.
    Generates a UUID-based filename to prevent collisions and path traversal.

    Usage:
        avatar = models.ImageField(upload_to=unique_upload_path("avatars"))
        thumbnail = models.ImageField(upload_to=unique_upload_path("courses/thumbnails"))
    """

    def _path(instance, filename):
        ext = Path(filename).suffix.lower()
        new_name = f"{uuid.uuid4().hex}{ext}"
        return os.path.join(subfolder, new_name)

    return _path


def validate_image_size(image, max_mb: float = 5.0):
    """
    Raise ValidationError if image exceeds max_mb megabytes.
    Use in model clean() or serializer validate_<field>().
    """
    from django.core.exceptions import ValidationError

    limit = max_mb * 1024 * 1024
    if image.size > limit:
        raise ValidationError(f"Image file too large. Maximum size is {max_mb} MB.")


def validate_file_extension(file, allowed_extensions: list[str]):
    """
    Raise ValidationError if the file extension is not in allowed_extensions.
    Pass extensions without the dot, e.g. ['pdf', 'docx'].
    """
    from django.core.exceptions import ValidationError

    ext = Path(file.name).suffix.lower().lstrip(".")
    if ext not in [e.lower() for e in allowed_extensions]:
        raise ValidationError(
            f"Unsupported file type '.{ext}'. Allowed: {', '.join(allowed_extensions)}."
        )


def human_readable_size(size_bytes: int) -> str:
    """Convert a byte count to a human-readable string, e.g. '2.3 MB'."""
    for unit in ("B", "KB", "MB", "GB"):
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"
