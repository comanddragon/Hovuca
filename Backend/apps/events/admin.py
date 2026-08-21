from django.contrib import admin
from django.utils.html import format_html

from apps.events.models import Event, EventCategory, EventImage, EventRegistration


# ---------------------------------------------------------------------------
# EventCategory
# ---------------------------------------------------------------------------


@admin.register(EventCategory)
class EventCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "color_badge", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("name",)

    def color_badge(self, obj):
        return format_html(
            '<span style="background:{}; padding:2px 10px; border-radius:4px; color:#fff;">{}</span>',
            obj.color,
            obj.color,
        )
    color_badge.short_description = "Color"


# ---------------------------------------------------------------------------
# Inlines
# ---------------------------------------------------------------------------


class EventImageInline(admin.TabularInline):
    model = EventImage
    extra = 1
    fields = ("image", "alt_text", "order")
    ordering = ("order",)


class EventRegistrationInline(admin.TabularInline):
    model = EventRegistration
    extra = 0
    fields = ("user", "status", "checked_in_at", "notes")
    readonly_fields = ("user", "checked_in_at")
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


# ---------------------------------------------------------------------------
# Event
# ---------------------------------------------------------------------------


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        "title", "category", "event_type", "status",
        "start_date", "end_date", "is_featured", "attendee_count", "view_count",
    )
    list_filter = ("status", "event_type", "is_featured", "category", "program")
    search_fields = ("title", "slug", "location_name", "description")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("view_count", "attendee_count", "is_full", "created_at", "updated_at")
    date_hierarchy = "start_date"
    ordering = ("-start_date",)
    autocomplete_fields = ("organizer", "category", "program")
    inlines = [EventImageInline, EventRegistrationInline]

    fieldsets = (
        ("Content", {
            "fields": ("title", "slug", "excerpt", "description", "cover_image", "cover_image_alt"),
        }),
        ("Organisation", {
            "fields": ("organizer", "program", "category"),
        }),
        ("Scheduling", {
            "fields": ("start_date", "end_date"),
        }),
        ("Location", {
            "fields": ("event_type", "location_name", "location_address", "online_url"),
        }),
        ("Registration", {
            "fields": (
                "is_registration_required", "registration_deadline",
                "max_attendees", "attendee_count", "is_full",
            ),
        }),
        ("Publishing", {
            "fields": ("status", "is_featured"),
        }),
        ("SEO", {
            "classes": ("collapse",),
            "fields": ("meta_title", "meta_description"),
        }),
        ("Stats & Timestamps", {
            "classes": ("collapse",),
            "fields": ("view_count", "created_at", "updated_at"),
        }),
    )

    actions = ["make_published", "make_cancelled", "make_draft"]

    @admin.action(description="Publish selected events")
    def make_published(self, request, queryset):
        updated = queryset.update(status=Event.Status.PUBLISHED)
        self.message_user(request, f"{updated} event(s) published.")

    @admin.action(description="Cancel selected events")
    def make_cancelled(self, request, queryset):
        updated = queryset.update(status=Event.Status.CANCELLED)
        self.message_user(request, f"{updated} event(s) cancelled.")

    @admin.action(description="Revert selected events to Draft")
    def make_draft(self, request, queryset):
        updated = queryset.update(status=Event.Status.DRAFT)
        self.message_user(request, f"{updated} event(s) moved to draft.")


# ---------------------------------------------------------------------------
# EventImage
# ---------------------------------------------------------------------------


@admin.register(EventImage)
class EventImageAdmin(admin.ModelAdmin):
    list_display = ("event", "order", "alt_text")
    list_filter = ("event",)
    search_fields = ("event__title", "alt_text")
    ordering = ("event", "order")


# ---------------------------------------------------------------------------
# EventRegistration
# ---------------------------------------------------------------------------


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ("user", "event", "status", "checked_in_at", "created_at")
    list_filter = ("status", "event")
    search_fields = ("user__email", "user__first_name", "user__last_name", "event__title")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)
    autocomplete_fields = ("user", "event")

    actions = ["confirm_registrations", "waitlist_registrations", "cancel_registrations"]

    @admin.action(description="Confirm selected registrations")
    def confirm_registrations(self, request, queryset):
        updated = queryset.update(status=EventRegistration.Status.CONFIRMED)
        self.message_user(request, f"{updated} registration(s) confirmed.")

    @admin.action(description="Move selected to Waitlist")
    def waitlist_registrations(self, request, queryset):
        updated = queryset.update(status=EventRegistration.Status.WAITLISTED)
        self.message_user(request, f"{updated} registration(s) moved to waitlist.")

    @admin.action(description="Cancel selected registrations")
    def cancel_registrations(self, request, queryset):
        updated = queryset.update(status=EventRegistration.Status.CANCELLED)
        self.message_user(request, f"{updated} registration(s) cancelled.")