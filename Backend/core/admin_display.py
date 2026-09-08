"""Reusable presentation helpers for HOVUCA admin list pages."""

from __future__ import annotations

from decimal import Decimal, InvalidOperation
from typing import Any

from django.utils.html import format_html
from django.utils.safestring import SafeString


def _image_url(image: Any) -> str:
    """Resolve a Django file field or plain URL without failing on empty files."""
    if not image:
        return ""
    if isinstance(image, str):
        return image
    try:
        return image.url
    except (AttributeError, ValueError):
        return ""


def image_thumbnail(image: Any, alt: str = "", size: int = 48) -> SafeString:
    """Render a lazy-loaded thumbnail from either an image field or URL."""
    url = _image_url(image)
    if url:
        return format_html(
            '<span class="admin-thumbnail" style="width:{}px;height:{}px">'
            '<img src="{}" alt="{}" width="{}" height="{}" loading="lazy">'
            "</span>",
            size,
            size,
            url,
            alt,
            size,
            size,
        )
    return format_html(
        '<span class="admin-thumbnail admin-thumbnail--empty" '
        'style="width:{}px;height:{}px" role="img" aria-label="No image">'
        '<span class="material-symbols-outlined" aria-hidden="true">{}</span></span>',
        size,
        size,
        "image_not_supported",
    )


def status_badge(value: str, label: str | None = None) -> SafeString:
    """Render common HOVUCA workflow states with one consistent badge."""
    tones = {
        "active": "green",
        "available": "green",
        "completed": "green",
        "published": "green",
        "in_progress": "amber",
        "pending": "amber",
        "busy": "amber",
        "planning": "blue",
        "review": "blue",
        "draft": "gray",
        "inactive": "gray",
        "archived": "gray",
        "cancelled": "red",
        "closed": "red",
        "failed": "red",
        "on_hold": "red",
        "refunded": "red",
    }
    text = label or value.replace("_", " ").title()
    return format_html(
        '<span class="status-badge status-{}">{}</span>', tones.get(value, "gray"), text
    )


def money_display(value: Any, currency: str = "USD") -> str:
    """Format money consistently without failing on blank values."""
    symbols = {"USD": "$", "GBP": "£", "EUR": "€", "NGN": "₦", "XAF": "FCFA "}
    try:
        amount = Decimal(value or 0)
    except (InvalidOperation, TypeError, ValueError):
        amount = Decimal(0)
    return f"{symbols.get(currency, f'{currency} ')}{amount:,.2f}"


def progress_bar(value: Any, *, maximum: int = 100) -> SafeString:
    """Render a clamped progress bar for campaigns and projects."""
    try:
        percentage = max(0, min(float(value or 0), float(maximum)))
    except (TypeError, ValueError):
        percentage = 0
    display_value = round(percentage, 1)
    return format_html(
        '<div class="progress-track" aria-label="{}% complete">'
        '<span class="progress-green" style="width:{}%"></span></div><small>{}%</small>',
        display_value,
        percentage,
        display_value,
    )
