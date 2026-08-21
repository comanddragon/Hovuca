"""
Reusable validators for models and serializers across all apps.
"""

import re
from django.core.exceptions import ValidationError


def validate_phone_number(value: str):
    """Accepts international E.164-ish formats: +237671234567 or 0671234567."""
    pattern = re.compile(r"^\+?[\d\s\-().]{7,20}$")
    if not pattern.match(value):
        raise ValidationError("Enter a valid phone number (e.g. +237671234567).")


def validate_hex_color(value: str):
    """Validates a 3 or 6-digit CSS hex color string, e.g. #3B82F6."""
    pattern = re.compile(r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
    if not pattern.match(value):
        raise ValidationError("Enter a valid hex color code (e.g. #3B82F6).")


def validate_positive_amount(value):
    """Decimal/float must be strictly greater than zero."""
    if value <= 0:
        raise ValidationError("Amount must be greater than zero.")


def validate_percentage(value):
    """Integer or float must be between 0 and 100 inclusive."""
    if not (0 <= value <= 100):
        raise ValidationError("Value must be between 0 and 100.")


def validate_slug_chars(value: str):
    """Slug must only contain lowercase letters, digits, and hyphens."""
    pattern = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    if not pattern.match(value):
        raise ValidationError(
            "Slug may only contain lowercase letters, digits, and hyphens."
        )
