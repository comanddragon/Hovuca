from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline

from .models import Branch, Department, Organization
from .models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(ModelAdmin):
    list_display = ["subject", "full_name", "topic", "status", "created_at"]
    list_filter = ["topic", "status"]
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


@admin.register(Organization)
class OrganizationAdmin(ModelAdmin):
    list_display = [
        "name",
        "slug",
        "email",
        "phone",
        "founded_year",
        "branch_count",
        "is_active",
        "created_at",
    ]
    list_filter = ["is_active", "founded_year"]
    search_fields = ["name", "slug", "email"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["id", "created_at", "updated_at"]
    inlines = [BranchInline]

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

    def branch_count(self, obj):
        count = obj.branches.filter(deleted_at__isnull=True).count()
        return format_html("<b>{}</b>", count)

    branch_count.short_description = "Branches"


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
