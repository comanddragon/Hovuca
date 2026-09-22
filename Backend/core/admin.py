"""Shared conventions and media previews for the HOVUCA admin."""

from pathlib import PurePosixPath
from urllib.parse import parse_qs, urlparse

from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin

from core.models import ApplicationLog


def image_preview(
    file_field,
    *,
    alt: str = "Image preview",
    max_width: int = 140,
    max_height: int = 100,
):
    """Render a compact image preview with a link to the original asset."""
    if not file_field:
        return "—"
    try:
        url = file_field.url
    except (AttributeError, ValueError):
        return "—"
    return format_html(
        '<a href="{}" target="_blank" rel="noopener">'
        '<img src="{}" alt="{}" style="max-width:{}px;max-height:{}px;object-fit:contain;" />'
        "</a>",
        url,
        url,
        alt,
        max_width,
        max_height,
    )


def document_preview(file_field, *, label: str = "Open document"):
    """Render an inline PDF preview and a reliable link for every document."""
    if not file_field:
        return "—"
    try:
        url = file_field.url
    except (AttributeError, ValueError):
        return "—"
    suffix = PurePosixPath(urlparse(url).path).suffix.lower()
    link = format_html(
        '<a href="{}" target="_blank" rel="noopener">{}</a>', url, label
    )
    if suffix != ".pdf":
        return link
    return format_html(
        '{}<iframe src="{}#toolbar=0" title="{}" '
        'style="display:block;width:100%;height:280px;border:0;margin-top:8px;"></iframe>',
        link,
        url,
        label,
    )


def video_preview(source, *, label: str = "Video preview"):
    """Preview direct video files and common hosted video URLs in the admin."""
    if not source:
        return "—"
    try:
        url = source.url
    except (AttributeError, ValueError):
        url = str(source)

    parsed = urlparse(url)
    host = parsed.netloc.lower().removeprefix("www.")
    if host in {"youtube.com", "m.youtube.com"}:
        video_id = parse_qs(parsed.query).get("v", [""])[0]
        if video_id:
            url = f"https://www.youtube-nocookie.com/embed/{video_id}"
    elif host == "youtu.be":
        url = f"https://www.youtube-nocookie.com/embed/{parsed.path.lstrip('/')}"
    elif host == "vimeo.com" and parsed.path.strip("/").isdigit():
        url = f"https://player.vimeo.com/video/{parsed.path.strip('/')}"

    if "youtube-nocookie.com/embed/" in url or "player.vimeo.com/video/" in url:
        return format_html(
            '<iframe src="{}" title="{}" allowfullscreen '
            'style="width:100%;max-width:640px;height:360px;border:0;"></iframe>',
            url,
            label,
        )

    suffix = PurePosixPath(urlparse(url).path).suffix.lower()
    if suffix in {".mp4", ".webm", ".ogg", ".mov"}:
        return format_html(
            '<video controls preload="metadata" style="width:100%;max-width:640px;max-height:360px;">'
            '<source src="{}"></video>',
            url,
        )
    return format_html(
        '<a href="{}" target="_blank" rel="noopener">Open {}</a>', url, label
    )


class HovucaModelAdmin(ModelAdmin):
    """Keep filtering consistent and deliberate across admin changelists."""

    list_filter_submit = True


@admin.register(ApplicationLog)
class ApplicationLogAdmin(HovucaModelAdmin):
    """A read-only, superuser-only view of persisted operational logs."""

    list_display = ("created_at", "level", "logger", "request_id", "short_message")
    list_filter = ("level", "created_at")
    search_fields = ("logger", "message", "request_id")
    readonly_fields = ("created_at", "level", "logger", "message", "request_id", "traceback")
    ordering = ("-created_at",)
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_module_permission(self, request):
        return request.user.is_superuser

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser

    @admin.display(description="Message")
    def short_message(self, obj):
        return obj.message[:160] + ("…" if len(obj.message) > 160 else "")
