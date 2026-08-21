"""
Celery tasks for the donations app.
Queues: payments, accounts
"""

import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    queue="payments",
    name="donations.process_donation_payment",
)
def process_donation_payment(self, donation_id: str):
    """
    Verify payment status with the gateway and update the Donation record.
    Triggered by: DonationViewSet.create()

    In production, replace the stub below with real gateway SDK calls
    (stripe.PaymentIntent.retrieve / paypal.Order.get).
    """
    from .models import Donation

    try:
        donation = Donation.objects.select_related("campaign", "donor").get(
            id=donation_id
        )
    except Donation.DoesNotExist:
        logger.warning("process_donation_payment: Donation %s not found.", donation_id)
        return

    if donation.status != Donation.Status.PENDING:
        logger.info(
            "process_donation_payment: Donation %s already processed.", donation_id
        )
        return

    try:
        # --- Gateway verification stub ---
        # In production call the appropriate gateway SDK here and set
        # donation.gateway_transaction_id from the real transaction ID.
        # For now we optimistically mark it completed.
        donation.status = Donation.Status.COMPLETED
        donation.save(update_fields=["status"])

        # Update campaign raised_amount
        if donation.campaign:
            _update_campaign_raised_amount(donation.campaign)

        logger.info(
            "Donation %s (%s %s) processed successfully.",
            donation_id,
            donation.amount,
            donation.currency,
        )

        # Fire receipt task
        send_donation_receipt.delay(donation_id)

    except Exception as exc:
        logger.error("process_donation_payment failed for %s: %s", donation_id, exc)
        donation.status = Donation.Status.FAILED
        donation.save(update_fields=["status"])
        raise self.retry(exc=exc)


def _update_campaign_raised_amount(campaign):
    """Recalculate raised_amount from completed donations and persist."""
    from django.db.models import Sum
    from .models import Donation

    total = (
        Donation.objects.filter(
            campaign=campaign,
            status=Donation.Status.COMPLETED,
            deleted_at__isnull=True,
        ).aggregate(total=Sum("amount"))["total"]
        or 0
    )

    campaign.raised_amount = total
    campaign.save(update_fields=["raised_amount"])


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="accounts",
    name="donations.send_donation_receipt",
)
def send_donation_receipt(self, donation_id: str):
    """
    Email a donation receipt to the donor.
    Triggered by: process_donation_payment (after successful completion)
    or Donation post_save signal.
    """
    from django.utils import timezone
    from .models import Donation

    try:
        donation = Donation.objects.select_related("donor", "campaign").get(
            id=donation_id
        )
    except Donation.DoesNotExist:
        return

    # Don't send to anonymous or donors without an email
    if donation.is_anonymous or not donation.donor:
        return

    if donation.receipt_sent:
        logger.info("Receipt already sent for donation %s — skipping.", donation_id)
        return

    try:
        context = {
            "donor": donation.donor,
            "donation": donation,
            "campaign": donation.campaign,
        }
        html_message = render_to_string("accounts/donations/receipt.html", context)
        plain_message = strip_tags(html_message)

        send_mail(
            subject=f"Your donation receipt — {donation.amount} {donation.currency}",
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[donation.donor.email],
            html_message=html_message,
            fail_silently=False,
        )

        donation.receipt_sent = True
        donation.receipt_sent_at = timezone.now()
        donation.save(update_fields=["receipt_sent", "receipt_sent_at"])

        logger.info(
            "Receipt sent to %s for donation %s", donation.donor.email, donation_id
        )

    except Exception as exc:
        logger.error(
            "send_donation_receipt failed for donation %s: %s", donation_id, exc
        )
        raise self.retry(exc=exc)


@shared_task(
    queue="accounts",
    name="donations.notify_campaign_goal_reached",
)
def notify_campaign_goal_reached(campaign_id: str):
    """
    Notify staff when a campaign reaches 100% of its goal.
    Triggered by: DonationCampaign post_save signal.
    """
    from .models import DonationCampaign
    from apps.accounts.models import User

    try:
        campaign = DonationCampaign.objects.get(id=campaign_id)
    except DonationCampaign.DoesNotExist:
        return

    staff_emails = list(
        User.objects.filter(role__in=("admin", "staff"), is_active=True).values_list(
            "email", flat=True
        )
    )

    if not staff_emails:
        return

    try:
        context = {"campaign": campaign}
        html_message = render_to_string("accounts/donations/goal_reached.html", context)
        plain_message = strip_tags(html_message)

        send_mail(
            subject=f"🎉 Campaign '{campaign.title}' reached its goal!",
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=staff_emails,
            html_message=html_message,
            fail_silently=True,
        )
        logger.info("Goal-reached notification sent for campaign %s", campaign_id)

    except Exception as exc:
        logger.error("notify_campaign_goal_reached failed for %s: %s", campaign_id, exc)
