import uuid

from django.db import models
from django.utils import timezone


def convert_instance_images_to_webp(instance):
    """Convert newly assigned JPG/PNG ImageFields before storage saves them."""
    from core.utils.images import to_webp

    for field in instance._meta.get_fields():
        if not isinstance(field, models.ImageField):
            continue
        field_file = getattr(instance, field.name)
        if not field_file or field_file._committed:
            continue
        converted = to_webp(field_file.file)
        if converted is None:
            continue
        content, new_name = converted
        field_file.save(new_name, content, save=False)


class BaseManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class BaseModel(models.Model):
    """
    Abstract base model with UUID primary key, timestamps, and soft delete.
    All app models inherit from this.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = BaseManager()
    all_objects = models.Manager()  # Includes soft-deleted records

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self._convert_images_to_webp()
        super().save(*args, **kwargs)

    def _convert_images_to_webp(self):
        convert_instance_images_to_webp(self)

    def soft_delete(self):
        """Mark record as deleted without removing from DB."""
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])

    def restore(self):
        """Restore a soft-deleted record."""
        self.deleted_at = None
        self.save(update_fields=["deleted_at"])

    @property
    def is_deleted(self):
        return self.deleted_at is not None
