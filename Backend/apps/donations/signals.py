"""
Signals for the donations app.
Connected in DonationsConfig.ready().
"""

import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(post_save, sender="donations.Donation")
def on_donation_status_changed(sender, instance, created, **kwargs):
    """
    When a donation transitions to COMPLETED:
      - Push in-app notification to the donor.
      - Check if the campaign goal has been reached.
    """
    if instance.status != "completed":
        return

    # In-app notification to donor
    if not instance.is_anonymous and instance.donor:
        try:
            from apps.notifications.tasks import send_notification

            send_notification.delay(
                user_id=str(instance.donor.id),
                notification_type="donation",
                title="Donation Confirmed ❤️",
                body=(
                    f"Thank you! Your donation of {instance.amount} {instance.currency} "
                    f"to '{instance.campaign.title if instance.campaign else 'HOVUCA'}' "
                    "was received."
                ),
                action_url=f"/donations/{instance.id}/",
            )
        except Exception as exc:
            logger.error("on_donation_status_changed notification failed: %s", exc)

    # Check campaign goal
    if instance.campaign:
        try:
            campaign = instance.campaign
            if (
                campaign.status == "active"
                and campaign.goal_amount
                and campaign.raised_amount >= campaign.goal_amount
            ):
                from .tasks import notify_campaign_goal_reached

                notify_campaign_goal_reached.delay(str(campaign.id))
        except Exception as exc:
            logger.error(
                "on_donation_status_changed campaign goal check failed: %s", exc
            )


@receiver(post_save, sender="donations.DonationCampaign")
def on_campaign_created(sender, instance, created, **kwargs):
    """
    Notify staff when a new campaign is created (status=draft → needs review).
    """
    if not created:
        return

    try:
        from apps.notifications.tasks import notify_staff

        notify_staff.delay(
            notification_type="donation",
            title=f"New Campaign: '{instance.title}'",
            body="A new donation campaign has been created and needs review.",
            action_url=f"/admin/donations/donationcampaign/{instance.id}/change/",
        )
    except Exception as exc:
        logger.error("on_campaign_created notification failed: %s", exc)
