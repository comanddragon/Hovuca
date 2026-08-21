"""
Signals for the blog app.
Connected in BlogConfig.ready().
"""

import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(post_save, sender="blog.Article")
def on_article_saved(sender, instance, created, **kwargs):
    """
    When an article transitions to PUBLISHED for the first time:
      - Send newsletter to students and volunteers.
      - Notify staff if a new article is submitted for review.
    """
    if instance.status == "published" and instance.published_at:
        # Only fire newsletter on the first publish (not on edits)
        try:
            from .tasks import send_article_published_newsletter

            # Use a flag on the instance to avoid double-firing within the same save cycle
            if not getattr(instance, "_newsletter_sent", False):
                instance._newsletter_sent = True
                send_article_published_newsletter.delay(str(instance.id))
        except Exception as exc:
            logger.error("on_article_saved newsletter dispatch failed: %s", exc)

    # New article submitted for review → notify staff
    if instance.status == "review" and not created:
        try:
            from apps.notifications.tasks import notify_staff

            notify_staff.delay(
                notification_type="system",
                title="📝 Article Pending Review",
                body=f"'{instance.title}' has been submitted for review.",
                action_url=f"/admin/blog/article/{instance.id}/change/",
            )
        except Exception as exc:
            logger.error("on_article_saved review notification failed: %s", exc)


@receiver(post_save, sender="blog.Comment")
def on_comment_saved(sender, instance, created, **kwargs):
    """
    When a new comment or reply is created and approved:
      - Notify the article author.
      - Notify the parent comment author if it's a reply.
    """
    if not created or not instance.is_approved:
        return

    try:
        from .tasks import notify_author_on_comment

        notify_author_on_comment.delay(str(instance.id))
    except Exception as exc:
        logger.error("on_comment_saved author notification failed: %s", exc)

    if instance.parent_id:
        try:
            from .tasks import notify_commenter_on_reply

            notify_commenter_on_reply.delay(str(instance.id))
        except Exception as exc:
            logger.error("on_comment_saved reply notification failed: %s", exc)
