from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html

from core.admin import HovucaModelAdmin as ModelAdmin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(ModelAdmin):
    list_display = [
        "title",
        "recipient",
        "type_badge",
        "is_read",
        "read_at",
        "created_at",
    ]
    list_filter = ["notification_type", "is_read", "created_at"]
    search_fields = ["title", "body", "recipient__email"]
    readonly_fields = ["id", "read_at", "created_at", "updated_at"]
    date_hierarchy = "created_at"

    fieldsets = (
        (
            "Notification",
            {
                "fields": (
                    "id",
                    "recipient",
                    "notification_type",
                    "title",
                    "body",
                    "action_url",
                ),
            },
        ),
        (
            "Linked Object",
            {
                "classes": ("collapse",),
                "fields": ("content_type", "object_id"),
            },
        ),
        (
            "Status",
            {
                "fields": ("is_read", "read_at"),
            },
        ),
        (
            "Timestamps",
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    actions = ["mark_as_read", "mark_as_unread"]

    def type_badge(self, obj):
        colors = {
            "system": "#6B7280",
            "course": "#8B5CF6",
            "quiz": "#F59E0B",
            "donation": "#DB2777",
            "volunteer": "#059669",
            "chat": "#2563EB",
        }
        color = colors.get(obj.notification_type, "#6B7280")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">{}</span>',
            color,
            obj.get_notification_type_display(),
        )

    type_badge.short_description = "Type"

    @admin.action(description="Mark selected notifications as read")
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True, read_at=timezone.now())
        self.message_user(request, f"{updated} notification(s) marked as read.")

    @admin.action(description="Mark selected notifications as unread")
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False, read_at=None)
        self.message_user(request, f"{updated} notification(s) marked as unread.")
