from django.contrib import admin
from django.db.models import Count, Q
from django.utils.html import format_html
from unfold.admin import TabularInline

from apps.donors.models import DonorContact, DonorEngagement, DonorOrganization, Grant
from core.admin import HovucaModelAdmin as ModelAdmin
from core.admin import document_preview, image_preview

# ---------------------------------------------------------------------------
# Inlines
# ---------------------------------------------------------------------------


class DonorContactInline(TabularInline):
    model = DonorContact
    extra = 0
    fields = ("first_name", "last_name", "role", "email", "phone", "is_primary")
    readonly_fields = ()
    show_change_link = True

    def get_queryset(self, request):
        return super().get_queryset(request).filter(deleted_at__isnull=True)


class GrantInline(TabularInline):
    model = Grant
    extra = 0
    fields = (
        "title", "reference_code", "funding_type",
        "amount", "currency", "status", "disbursed_date",
    )
    readonly_fields = ("reference_code",)
    show_change_link = True

    def get_queryset(self, request):
        return super().get_queryset(request).filter(deleted_at__isnull=True)


class DonorEngagementInline(TabularInline):
    model = DonorEngagement
    extra = 0
    fields = ("type", "date", "contact", "logged_by", "summary", "next_action_date")
    readonly_fields = ("logged_by",)
    show_change_link = True

    def get_queryset(self, request):
        return super().get_queryset(request).filter(deleted_at__isnull=True)


# ---------------------------------------------------------------------------
# DonorOrganization
# ---------------------------------------------------------------------------


@admin.register(DonorOrganization)
class DonorOrganizationAdmin(ModelAdmin):
    list_display = (
        "logo_thumbnail", "name", "abbreviation", "type", "tier_badge",
        "status", "country", "total_funded", "currency",
        "grant_count_display", "relationship_owner", "last_funded_at",
    )
    list_display_links = ("name",)
    list_filter = ("status", "tier", "type", "country")
    search_fields = ("name", "abbreviation", "email", "city", "country")
    readonly_fields = (
        "slug", "total_funded", "first_funded_at", "last_funded_at",
        "created_at", "updated_at", "logo_thumbnail",
    )
    autocomplete_fields = ("relationship_owner",)
    prepopulated_fields = {}  # slug is auto-generated in model.save()
    ordering = ("-total_funded", "name")
    inlines = [DonorContactInline, GrantInline, DonorEngagementInline]
    save_on_top = True

    fieldsets = (
        ("Identity", {
            "fields": (
                "name", "slug", "abbreviation", "type",
                "logo", "logo_thumbnail", "description",
            ),
        }),
        ("Contact", {
            "fields": ("website", "email", "phone"),
        }),
        ("Location", {
            "fields": ("country", "city", "address"),
        }),
        ("Classification", {
            "fields": ("tier", "status", "focus_areas"),
        }),
        ("Relationship", {
            "fields": ("relationship_owner", "prefers_anonymous", "notes"),
        }),
        ("Financials (auto-updated)", {
            "fields": (
                "total_funded", "currency",
                "first_funded_at", "last_funded_at",
            ),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .filter(deleted_at__isnull=True)
            .annotate(
                _grant_count=Count(
                    "grants", filter=Q(grants__deleted_at__isnull=True)
                )
            )
            .select_related("relationship_owner")
        )

    @admin.display(description="Logo")
    def logo_thumbnail(self, obj):
        return image_preview(obj.logo, alt=f"Logo for {obj.name}")

    @admin.display(description="Tier", ordering="tier")
    def tier_badge(self, obj):
        colours = {
            "platinum": "#7E9DAB",
            "gold": "#C9A84C",
            "silver": "#9E9E9E",
            "bronze": "#A0522D",
        }
        colour = colours.get(obj.tier, "#999")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;'
            'border-radius:12px;font-size:11px;font-weight:600;">{}</span>',
            colour,
            obj.get_tier_display(),
        )

    @admin.display(description="Grants", ordering="_grant_count")
    def grant_count_display(self, obj):
        return obj._grant_count

    actions = ["recalculate_totals_action"]

    @admin.action(description="Recalculate totals & tier for selected donors")
    def recalculate_totals_action(self, request, queryset):
        from apps.donors import services
        count = 0
        for org in queryset:
            org.recalculate_totals()
            services.recalculate_donor_tier(org)
            count += 1
        self.message_user(request, f"Recalculated totals for {count} donor(s).")


# ---------------------------------------------------------------------------
# DonorContact
# ---------------------------------------------------------------------------


@admin.register(DonorContact)
class DonorContactAdmin(ModelAdmin):
    list_display = (
        "full_name_display", "organization", "role",
        "email", "phone", "is_primary",
    )
    list_filter = ("role", "is_primary", "organization")
    search_fields = ("first_name", "last_name", "email", "organization__name")
    autocomplete_fields = ("organization",)
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (None, {
            "fields": (
                "organization", "first_name", "last_name",
                "role", "email", "phone", "is_primary", "notes",
            ),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .filter(deleted_at__isnull=True)
            .select_related("organization")
        )

    @admin.display(description="Name", ordering="last_name")
    def full_name_display(self, obj):
        return obj.get_full_name()


# ---------------------------------------------------------------------------
# Grant
# ---------------------------------------------------------------------------


@admin.register(Grant)
class GrantAdmin(ModelAdmin):
    list_display = (
        "title", "reference_code", "donor_organization",
        "funding_type", "amount", "currency", "status_badge",
        "disbursed_date", "reporting_deadline", "report_submitted",
        "internal_owner",
    )
    list_filter = ("status", "funding_type", "currency", "report_submitted")
    search_fields = (
        "title", "reference_code",
        "donor_organization__name", "internal_owner__email",
    )
    autocomplete_fields = ("donor_organization", "contact", "internal_owner", "program", "project")
    readonly_fields = ("agreement_document_preview", "report_submitted_at", "created_at", "updated_at")
    date_hierarchy = "disbursed_date"
    ordering = ("-disbursed_date", "-created_at")
    save_on_top = True

    fieldsets = (
        ("Core", {
            "fields": (
                "donor_organization", "title", "reference_code",
                "funding_type", "amount", "currency", "status",
            ),
        }),
        ("Links", {
            "fields": ("program", "project", "campaign"),
        }),
        ("Timeline", {
            "fields": ("agreement_date", "disbursed_date", "reporting_deadline"),
        }),
        ("Documents & Reporting", {
            "fields": (
                "agreement_document",
                "agreement_document_preview",
                "report_submitted", "report_submitted_at",
            ),
        }),
        ("People", {
            "fields": ("contact", "internal_owner"),
        }),
        ("Notes", {
            "fields": ("notes",),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .filter(deleted_at__isnull=True)
            .select_related(
                "donor_organization", "contact",
                "internal_owner", "program", "project",
            )
        )

    @admin.display(description="Agreement preview")
    def agreement_document_preview(self, obj):
        return document_preview(obj.agreement_document, label=obj.title)

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        colours = {
            "pending": "#E6A817",
            "completed": "#2E7D32",
            "cancelled": "#C62828",
        }
        colour = colours.get(obj.status, "#888")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;'
            'border-radius:12px;font-size:11px;font-weight:600;">{}</span>',
            colour,
            obj.get_status_display(),
        )

    actions = ["mark_completed_action", "mark_report_submitted_action"]

    @admin.action(description="Mark selected grants as completed")
    def mark_completed_action(self, request, queryset):
        from apps.donors import services
        count = 0
        for grant in queryset.filter(status=Grant.Status.PENDING):
            services.mark_grant_completed(grant)
            count += 1
        self.message_user(request, f"{count} grant(s) marked as completed.")

    @admin.action(description="Mark report as submitted for selected grants")
    def mark_report_submitted_action(self, request, queryset):
        from apps.donors import services
        count = 0
        for grant in queryset.filter(report_submitted=False):
            services.mark_report_submitted(grant)
            count += 1
        self.message_user(request, f"Report marked as submitted for {count} grant(s).")


# ---------------------------------------------------------------------------
# DonorEngagement
# ---------------------------------------------------------------------------


@admin.register(DonorEngagement)
class DonorEngagementAdmin(ModelAdmin):
    list_display = (
        "organization", "type", "date", "contact",
        "logged_by", "next_action_date", "grant",
    )
    list_filter = ("type", "date")
    search_fields = (
        "organization__name", "contact__first_name", "contact__last_name",
        "logged_by__email", "summary",
    )
    autocomplete_fields = ("organization", "contact", "logged_by", "grant")
    readonly_fields = ("logged_by", "created_at", "updated_at")
    date_hierarchy = "date"
    ordering = ("-date", "-created_at")

    fieldsets = (
        (None, {
            "fields": (
                "organization", "contact", "logged_by",
                "grant", "type", "date",
            ),
        }),
        ("Details", {
            "fields": ("summary", "outcome", "next_action", "next_action_date"),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .filter(deleted_at__isnull=True)
            .select_related("organization", "contact", "logged_by", "grant")
        )

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.logged_by = request.user
        super().save_model(request, obj, form, change)
