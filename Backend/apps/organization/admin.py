from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import TabularInline

from core.admin import HovucaModelAdmin as ModelAdmin
from core.admin import image_preview

from .models import Branch, ContactMessage, Department, Organization
from apps.donors.models import DonorOrganization


@admin.register(ContactMessage)
class ContactMessageAdmin(ModelAdmin):
    list_display = ["subject", "full_name", "topic", "status", "created_at"]
    list_filter = ["topic", "status", "created_at"]
    search_fields = ["full_name", "email", "subject", "message"]
    readonly_fields = ["full_name", "email", "phone", "topic", "subject", "message", "contact_consent", "created_at", "updated_at"]

    def has_add_permission(self, request):
        return False


class BranchInline(TabularInline):
    model = Branch
    fields = ["name", "slug", "location", "manager", "is_active"]
    extra = 0
    show_change_link = True


class DepartmentInline(TabularInline):
    model = Department
    fields = ["name", "description", "head"]
    extra = 0
    show_change_link = True


class DonorOrganizationInline(TabularInline):
    model = DonorOrganization
    fields = ["name", "type", "tier", "status", "total_funded", "currency"]
    readonly_fields = ["total_funded"]
    extra = 0
    show_change_link = True


@admin.register(Organization)
class OrganizationAdmin(ModelAdmin):
    list_display = [
        "name",
        "slug",
        "email",
        "phone",
        "founded_year",
        "branch_count",
        "donor_count",
        "is_active",
        "created_at",
    ]
    list_filter = ["is_active", "founded_year"]
    search_fields = ["name", "slug", "email"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["id", "logo_preview", "created_at", "updated_at"]
    inlines = [BranchInline, DonorOrganizationInline]

    fieldsets = (
        (
            "Profile",
            {
                "fields": (
                    "id",
                    "name",
                    "slug",
                    "description",
                    "logo",
                    "logo_preview",
                    "founded_year",
                    "is_active",
                ),
            },
        ),
        (
            "Contact",
            {
                "fields": ("website", "email", "phone", "address"),
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

    def get_queryset(self, request):
        from django.db.models import Count, Q
        return (
            super()
            .get_queryset(request)
            .annotate(
                _branch_count=Count(
                    "branches", filter=Q(branches__deleted_at__isnull=True), distinct=True
                ),
                _donor_count=Count(
                    "donors", filter=Q(donors__deleted_at__isnull=True), distinct=True
                ),
            )
        )

    @admin.display(description="Branches", ordering="_branch_count")
    def branch_count(self, obj):
        count = getattr(obj, "_branch_count", obj.branches.filter(deleted_at__isnull=True).count())
        return format_html("<b>{}</b>", count)

    @admin.display(description="Donors", ordering="_donor_count")
    def donor_count(self, obj):
        count = getattr(obj, "_donor_count", obj.donors.filter(deleted_at__isnull=True).count())
        return format_html("<b>{}</b>", count)

    @admin.display(description="Logo preview")
    def logo_preview(self, obj):
        return image_preview(obj.logo, alt=f"Logo for {obj.name}")


@admin.register(Branch)
class BranchAdmin(ModelAdmin):
    list_display = [
        "name",
        "organization",
        "location",
        "manager",
        "department_count",
        "is_active",
        "created_at",
    ]
    list_filter = ["is_active", "organization"]
    search_fields = ["name", "slug", "location", "organization__name"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["id", "created_at", "updated_at"]
    autocomplete_fields = ["manager"]
    inlines = [DepartmentInline]

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "id",
                    "organization",
                    "name",
                    "slug",
                    "location",
                    "manager",
                    "is_active",
                ),
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

    def department_count(self, obj):
        return obj.departments.filter(deleted_at__isnull=True).count()

    department_count.short_description = "Departments"


@admin.register(Department)
class DepartmentAdmin(ModelAdmin):
    list_display = ["name", "branch", "head", "volunteer_count", "created_at"]
    list_filter = ["branch__organization", "branch"]
    search_fields = ["name", "branch__name", "head__email"]
    readonly_fields = ["id", "created_at", "updated_at"]
    autocomplete_fields = ["head"]

    fieldsets = (
        (
            None,
            {
                "fields": ("id", "branch", "name", "description", "head"),
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

    def volunteer_count(self, obj):
        return obj.volunteers.filter(deleted_at__isnull=True).count()

    volunteer_count.short_description = "Volunteers"
