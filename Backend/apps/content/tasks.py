"""
Django tasks for the blog app.
Queue: accounts, default
"""

import logging

from core.tasking import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


@shared_task(
    queue="accounts",
    name="blog.notify_author_on_comment",
)
def notify_author_on_comment(comment_id: str):
    """
    Notify the article author when a new approved comment is posted.
    Triggered by: Comment post_save signal.
    """
    from .models import Comment

    try:
        comment = Comment.objects.select_related("article__author", "author").get(
            id=comment_id
        )
    except Comment.DoesNotExist:
        return

    article = comment.article
    if not article.author or article.author == comment.author:
        return  # Don't notify self-comments

    try:
        from apps.notifications.tasks import send_notification

        send_notification.enqueue(
            user_id=str(article.author.id),
            notification_type="system",
            title="💬 New comment on your article",
            body=(
                f"{comment.author.get_full_name() if comment.author else 'Someone'} "
                f"commented on '{article.title[:60]}'."
            ),
            action_url=f"/blog/{article.slug}/#comment-{comment.id}",
        )
    except Exception as exc:
        logger.error(
            "notify_author_on_comment failed for comment %s: %s", comment_id, exc
        )


@shared_task(
    queue="accounts",
    name="blog.notify_commenter_on_reply",
)
def notify_commenter_on_reply(reply_id: str):
    """
    Notify the parent comment author when someone replies to their comment.
    Triggered by: Comment post_save signal when parent is set.
    """
    from .models import Comment

    try:
        reply = Comment.objects.select_related(
            "parent__author", "author", "article"
        ).get(id=reply_id)
    except Comment.DoesNotExist:
        return

    if not reply.parent or not reply.parent.author:
        return
    if reply.parent.author == reply.author:
        return  # Don't notify self-replies

    try:
        from apps.notifications.tasks import send_notification

        send_notification.enqueue(
            user_id=str(reply.parent.author.id),
            notification_type="system",
            title="↩️ Someone replied to your comment",
            body=(
                f"{reply.author.get_full_name() if reply.author else 'Someone'} "
                f"replied to your comment on '{reply.article.title[:60]}'."
            ),
            action_url=f"/blog/{reply.article.slug}/#comment-{reply.id}",
        )
    except Exception as exc:
        logger.error("notify_commenter_on_reply failed for reply %s: %s", reply_id, exc)


@shared_task(
    queue="accounts",
    name="blog.send_article_published_newsletter",
)
def send_article_published_newsletter(article_id: str):
    """
    Notify all active enrolled students and volunteers when a new article
    is published. Sends a lightweight newsletter-style email.
    Triggered by: Article post_save signal when status transitions to PUBLISHED.
    """
    from .models import Article, NewsletterSubscriber
    from apps.accounts.models import User

    try:
        article = Article.objects.select_related("author", "category").get(
            id=article_id
        )
    except Article.DoesNotExist:
        return

    if not article.is_published:
        return

    # Only send to active students and volunteers (keep it relevant)
    account_emails = list(
        User.objects.filter(
            role__in=("student", "volunteer"),
            is_active=True,
        ).values_list("email", flat=True)
    )
    subscriber_emails = NewsletterSubscriber.objects.filter(is_active=True).values_list("email", flat=True)
    recipients = sorted({*account_emails, *subscriber_emails})

    if not recipients:
        return

    try:
        context = {
            "article": article,
            "frontend_url": getattr(settings, "FRONTEND_URL", "https://hovuca.org"),
        }
        html_message = render_to_string("accounts/blog/new_article.html", context)
        plain_message = strip_tags(html_message)

        send_mail(
            subject=f"📰 New article: {article.title}",
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            html_message=html_message,
            fail_silently=True,
        )
        logger.info(
            "Article newsletter sent for '%s' to %d recipient(s).",
            article.title,
            len(recipients),
        )
    except Exception as exc:
        logger.error(
            "send_article_published_newsletter failed for article %s: %s",
            article_id,
            exc,
        )
