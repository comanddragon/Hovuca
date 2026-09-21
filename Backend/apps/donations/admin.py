from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline

from .models import Donation, DonationCampaign, DonationPaymentSettings


@admin.register(DonationPaymentSettings)
class DonationPaymentSettingsAdmin(ModelAdmin):
    readonly_fields = ["id", "created_at", "updated_at"]
    fieldsets = (
        ("Direct bank transfer", {"fields": ["bank_name", "account_name", "account_number", "iban", "swift_code", "bank_currency", "bank_instructions"]}),
        ("PayPal", {"fields": ["paypal_url"], "description": "Paste your organization's HTTPS PayPal donation link."}),
        ("CamPay", {"fields": ["campay_url"], "description": "Paste your CamPay payment link. Donors choose MTN MoMo or Orange Money at checkout. Never enter API secrets here."}),
    )

    def has_add_permission(self, request):
        return super().has_add_permission(request) and not DonationPaymentSettings.all_objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


class DonationInline(TabularInline):
    model = Donation
    fields = [
        "donor",
        "amount",
        "currency",
        "gateway",
        "status",
        "is_anonymous",
        "created_at",
    ]
    readonly_fields = [
        "donor",
        "amount",
        "currency",
        "gateway",
        "status",
        "is_anonymous",
        "created_at",
    ]
    extra = 0
    show_change_link = True
    can_delete = False


@admin.register(DonationCampaign)
class DonationCampaignAdmin(ModelAdmin):
    list_display = [
        "title",
        "program",
        "status_badge",
        "goal_amount",
        "raised_amount",
        "progress_bar",
        "donor_count",
        "start_date",
        "end_date",
    ]
    list_filter = ["status", "program__organization", "created_at"]
    search_fields = ["title", "slug", "description"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = [
        "id",
        "raised_amount",
        "created_at",
        "updated_at",
        "progress_bar",
        "donor_count",
    ]
    inlines = [DonationInline]
    date_hierarchy = "created_at"

    fieldsets = (
        (
            "Campaign",
            {
                "fields": ("id", "program", "title", "slug", "description", "banner"),
            },
        ),
        (
            "Fundraising",
            {
                "fields": ("goal_amount", "raised_amount", "progress_bar", "status"),
            },
        ),
        (
            "Schedule",
            {
                "fields": ("start_date", "end_date"),
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

    actions = ["activate_campaigns", "close_campaigns"]

    def status_badge(self, obj):
        colors = {
            "draft": "#6B7280",
            "active": "#10B981",
            "closed": "#EF4444",
        }
        color = colors.get(obj.status, "#6B7280")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"

    def progress_bar(self, obj):
        pct = min(obj.progress_percentage, 100)
        color = "#10B981" if pct >= 100 else "#3B82F6"
        return format_html(
            '<div style="width:150px;background:#E5E7EB;border-radius:4px;overflow:hidden;">'
            '<div style="width:{pct}%;background:{color};height:14px;"></div></div>'
            "<small>{pct}%</small>",
            pct=pct,
            color=color,
        )

    progress_bar.short_description = "Progress"

    def donor_count(self, obj):
        return (
            obj.donations.filter(status=Donation.Status.COMPLETED)
            .values("donor")
            .distinct()
            .count()
        )

    donor_count.short_description = "Donors"

    @admin.action(description="Activate selected campaigns")
    def activate_campaigns(self, request, queryset):
        queryset.update(status=DonationCampaign.Status.ACTIVE)
        self.message_user(request, "Campaigns activated.")

    @admin.action(description="Close selected campaigns")
    def close_campaigns(self, request, queryset):
        queryset.update(status=DonationCampaign.Status.CLOSED)
        self.message_user(request, "Campaigns closed.")


@admin.register(Donation)
class DonationAdmin(ModelAdmin):
    list_display = [
        "donor_display",
        "campaign",
        "amount_display",
        "gateway",
        "status_badge",
        "receipt_sent",
        "created_at",
    ]
    list_filter = ["status", "gateway", "is_anonymous", "receipt_sent", "created_at"]
    search_fields = ["donor__email", "gateway_transaction_id", "campaign__title"]
    readonly_fields = [
        "id",
        "gateway_transaction_id",
        "receipt_sent",
        "receipt_sent_at",
        "created_at",
        "updated_at",
    ]
    date_hierarchy = "created_at"

    fieldsets = (
        (
            "Donor",
            {
                "fields": ("id", "donor", "is_anonymous", "message"),
            },
        ),
        (
            "Transaction",
            {
                "fields": (
                    "campaign",
                    "amount",
                    "currency",
                    "gateway",
                    "gateway_transaction_id",
                    "status",
                ),
            },
        ),
        (
            "Receipt",
            {
                "fields": ("receipt_sent", "receipt_sent_at"),
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

    actions = ["mark_completed", "mark_refunded", "send_receipts"]

    def donor_display(self, obj):
        if obj.is_anonymous:
            return format_html('<em style="color:#6B7280;">{}</em>', "Anonymous")
        return str(obj.donor) if obj.donor else "—"

    donor_display.short_description = "Donor"

    def amount_display(self, obj):
        return format_html("<b>{} {}</b>", obj.amount, obj.currency)

    amount_display.short_description = "Amount"

    def status_badge(self, obj):
        colors = {
            "pending": "#F59E0B",
            "completed": "#10B981",
            "failed": "#EF4444",
            "refunded": "#6B7280",
        }
        color = colors.get(obj.status, "#6B7280")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"

    @admin.action(description="Mark selected donations as Completed")
    def mark_completed(self, request, queryset):
        queryset.update(status=Donation.Status.COMPLETED)
        self.message_user(request, "Donations marked as Completed.")

    @admin.action(description="Mark selected donations as Refunded")
    def mark_refunded(self, request, queryset):
        queryset.update(status=Donation.Status.REFUNDED)
        self.message_user(request, "Donations marked as Refunded.")

    @admin.action(description="Mark receipts as sent")
    def send_receipts(self, request, queryset):
        queryset.update(receipt_sent=True, receipt_sent_at=timezone.now())
        self.message_user(request, "Receipts marked as sent.")
