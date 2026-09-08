from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from unfold.admin import ModelAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    list_display = [
        "email",
        "full_name",
        "role_badge",
        "is_active",
        "is_email_verified",
        "is_staff",
        "last_login_ip",
        "created_at",
    ]
    list_filter = ["role", "is_active", "is_staff", "is_email_verified", "created_at"]
    search_fields = ["email", "first_name", "last_name", "phone_number"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at", "last_login_ip", "last_login"]

    fieldsets = (
        (
            "Identity",
            {
                "fields": (
                    "id",
                    "email",
                    "first_name",
                    "last_name",
                    "phone_number",
                    "avatar",
                ),
            },
        ),
        (
            "Role & Access",
            {
                "fields": (
                    "role",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "is_email_verified",
                ),
            },
        ),
        (
            "Permissions",
            {
                "classes": ("collapse",),
                "fields": ("groups", "user_permissions"),
            },
        ),
        (
            "Timestamps",
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at", "last_login", "last_login_ip"),
            },
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "role",
                    "password1",
                    "password2",
                    "is_active",
                    "is_staff",
                ),
            },
        ),
    )

    # Override BaseUserAdmin — it uses `username`, we use `email`
    filter_horizontal = ["groups", "user_permissions"]

    def full_name(self, obj):
        return obj.get_full_name()

    full_name.short_description = "Name"

    def role_badge(self, obj):
        colors = {
            "admin": "#7C3AED",
            "staff": "#2563EB",
            "volunteer": "#059669",
            "student": "#D97706",
            "donor": "#DB2777",
        }
        color = colors.get(obj.role, "#6B7280")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;'
            'border-radius:4px;font-size:11px;font-weight:600;">{}</span>',
            color,
            obj.get_role_display(),
        )

    role_badge.short_description = "Role"

    actions = ["activate_users", "deactivate_users", "verify_emails"]

    @admin.action(description="Activate selected users")
    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} user(s) activated.")

    @admin.action(description="Deactivate selected users")
    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} user(s) deactivated.")

    @admin.action(description="Mark accounts as verified")
    def verify_emails(self, request, queryset):
        updated = queryset.update(is_email_verified=True)
        self.message_user(request, f"{updated} user(s) email(s) verified.")
