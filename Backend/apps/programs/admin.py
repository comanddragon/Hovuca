from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline

from .models import Program, Project


class ProjectInline(TabularInline):
    model = Project
    fields = ["title", "slug", "excerpt", "lead", "status", "budget", "start_date", "end_date"]
    extra = 0
    show_change_link = True


@admin.register(Program)
class ProgramAdmin(ModelAdmin):
    list_display = [
        "title",
        "organization",
        "status_badge",
        "start_date",
        "end_date",
        "target_beneficiaries",
        "project_count",
        "created_at",
    ]
    list_filter = ["status", "organization", "created_at"]
    search_fields = ["title", "slug", "description"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ["id", "created_at", "updated_at"]
    date_hierarchy = "created_at"
    inlines = [ProjectInline]

    fieldsets = (
        (
            "Details",
            {
                "fields": (
                    "id",
                    "organization",
                    "title",
                    "slug",
                    "excerpt",
                    "description",
                    "banner",
                ),
            },
        ),
        (
            "Schedule & Status",
            {
                "fields": ("status", "start_date", "end_date", "target_beneficiaries"),
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

    actions = ["mark_active", "mark_completed", "mark_cancelled"]

    def status_badge(self, obj):
        colors = {
            "draft": "#6B7280",
            "active": "#10B981",
            "completed": "#2563EB",
            "cancelled": "#EF4444",
        }
        color = colors.get(obj.status, "#6B7280")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"

    def project_count(self, obj):
        return obj.projects.filter(deleted_at__isnull=True).count()

    project_count.short_description = "Projects"

    @admin.action(description="Mark as Active")
    def mark_active(self, request, queryset):
        queryset.update(status=Program.Status.ACTIVE)
        self.message_user(request, "Programs marked as Active.")

    @admin.action(description="Mark as Completed")
    def mark_completed(self, request, queryset):
        queryset.update(status=Program.Status.COMPLETED)
        self.message_user(request, "Programs marked as Completed.")

    @admin.action(description="Mark as Cancelled")
    def mark_cancelled(self, request, queryset):
        queryset.update(status=Program.Status.CANCELLED)
        self.message_user(request, "Programs marked as Cancelled.")


@admin.register(Project)
class ProjectAdmin(ModelAdmin):
    list_display = [
        "title",
        "program",
        "lead",
        "status_badge",
        "raised_amount",
        "progress_percentage",
        "budget",
        "start_date",
        "end_date",
        "created_at",
    ]
    list_filter = ["status", "program__organization", "program"]
    search_fields = ["title", "slug", "description", "lead__email"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ["id", "created_at", "updated_at"]
    autocomplete_fields = ["lead"]
    date_hierarchy = "created_at"

    fieldsets = (
        (
            "Details",
            {
                "fields": ("id", "program", "title", "slug", "progress_percentage", "cover_image", "cover_image_alt", "excerpt", "description", "lead"),
            },
        ),
        (
            "Schedule & Budget",
            {
                "fields": ("status", "budget", "start_date", "end_date"),
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

    def status_badge(self, obj):
        colors = {
            "planning": "#6B7280",
            "in_progress": "#F59E0B",
            "completed": "#10B981",
            "on_hold": "#EF4444",
        }
        color = colors.get(obj.status, "#6B7280")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"
