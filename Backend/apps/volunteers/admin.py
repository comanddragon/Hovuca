from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import TabularInline

from core.admin import HovucaModelAdmin as ModelAdmin

from .models import VolunteerApplication, VolunteerProfile, VolunteerTask


@admin.register(VolunteerApplication)
class VolunteerApplicationAdmin(ModelAdmin):
    list_display = ["full_name", "email", "location", "interests", "status", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["full_name", "email", "phone", "location", "skills"]
    readonly_fields = ["id", "created_at", "updated_at", "contact_consent"]


class VolunteerTaskInline(TabularInline):
    model = VolunteerTask
    fields = ["title", "project", "status", "due_date", "hours_logged"]
    extra = 0
    show_change_link = True


@admin.register(VolunteerProfile)
class VolunteerProfileAdmin(ModelAdmin):
    list_display = [
        "user",
        "department",
        "availability_badge",
        "hours_contributed",
        "skills_display",
        "created_at",
    ]
    list_filter = ["availability", "department__branch__organization", "department"]
    search_fields = ["user__email", "user__first_name", "user__last_name", "bio"]
    readonly_fields = ["id", "created_at", "updated_at"]
    autocomplete_fields = ["user"]
    inlines = [VolunteerTaskInline]

    fieldsets = (
        (
            "Volunteer",
            {
                "fields": (
                    "id",
                    "user",
                    "bio",
                    "skills",
                    "availability",
                    "hours_contributed",
                ),
            },
        ),
        (
            "Assignment",
            {
                "fields": ("department",),
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

    actions = ["mark_available", "mark_inactive"]

    def availability_badge(self, obj):
        colors = {
            "available": "#10B981",
            "busy": "#F59E0B",
            "inactive": "#6B7280",
        }
        color = colors.get(obj.availability, "#6B7280")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">{}</span>',
            color,
            obj.get_availability_display(),
        )

    availability_badge.short_description = "Availability"

    def skills_display(self, obj):
        if not obj.skills:
            return "—"
        return ", ".join(obj.skills[:5]) + ("…" if len(obj.skills) > 5 else "")

    skills_display.short_description = "Skills"

    @admin.action(description="Mark as Available")
    def mark_available(self, request, queryset):
        queryset.update(availability=VolunteerProfile.AvailabilityStatus.AVAILABLE)
        self.message_user(request, "Volunteers marked as Available.")

    @admin.action(description="Mark as Inactive")
    def mark_inactive(self, request, queryset):
        queryset.update(availability=VolunteerProfile.AvailabilityStatus.INACTIVE)
        self.message_user(request, "Volunteers marked as Inactive.")


@admin.register(VolunteerTask)
class VolunteerTaskAdmin(ModelAdmin):
    list_display = [
        "title",
        "volunteer",
        "project",
        "status_badge",
        "due_date",
        "hours_logged",
        "created_at",
    ]
    list_filter = ["status", "due_date", "created_at"]
    search_fields = ["title", "volunteer__user__email", "description"]
    readonly_fields = ["id", "created_at", "updated_at"]
    date_hierarchy = "due_date"

    fieldsets = (
        (
            "Task",
            {
                "fields": ("id", "volunteer", "project", "title", "description"),
            },
        ),
        (
            "Progress",
            {
                "fields": ("status", "due_date", "hours_logged"),
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

    actions = ["mark_completed", "mark_cancelled"]

    def status_badge(self, obj):
        colors = {
            "pending": "#6B7280",
            "in_progress": "#F59E0B",
            "completed": "#10B981",
            "cancelled": "#EF4444",
        }
        color = colors.get(obj.status, "#6B7280")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"

    @admin.action(description="Mark selected tasks as Completed")
    def mark_completed(self, request, queryset):
        queryset.update(status=VolunteerTask.Status.COMPLETED)
        self.message_user(request, "Tasks marked as Completed.")

    @admin.action(description="Mark selected tasks as Cancelled")
    def mark_cancelled(self, request, queryset):
        queryset.update(status=VolunteerTask.Status.CANCELLED)
        self.message_user(request, "Tasks marked as Cancelled.")
