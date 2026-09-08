"""Permission-aware navigation and model icons for the HOVUCA admin."""

from __future__ import annotations

from django.contrib import admin
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

MODEL_ICONS = {
    "accounts.user": "manage_accounts",
    "auth.group": "group_work",
    "blogs.article": "article",
    "blogs.bookmark": "bookmark",
    "blogs.category": "category",
    "blogs.comment": "comment",
    "blogs.like": "favorite",
    "blogs.resource": "description",
    "blogs.tag": "sell",
    "donations.donation": "volunteer_activism",
    "donations.donationcampaign": "campaign",
    "donors.donorcontact": "contact_page",
    "donors.donorengagement": "forum",
    "donors.donororganization": "handshake",
    "donors.grant": "request_quote",
    "elearning.chapter": "menu_book",
    "elearning.course": "school",
    "elearning.enrollment": "how_to_reg",
    "elearning.module": "view_module",
    "elearning.question": "help",
    "elearning.quiz": "quiz",
    "elearning.quizattempt": "fact_check",
    "elearning.subject": "topic",
    "events.event": "event",
    "events.eventcategory": "event_list",
    "events.eventimage": "image",
    "events.eventregistration": "event_available",
    "gallery.galleryalbum": "photo_library",
    "gallery.galleryimage": "photo",
    "notifications.notification": "notifications",
    "organization.branch": "account_tree",
    "organization.department": "groups",
    "organization.organization": "corporate_fare",
    "programs.program": "diversity_3",
    "programs.project": "work",
    "volunteers.volunteerprofile": "group",
    "volunteers.volunteertask": "task_alt",
    "django_celery_beat.clockedschedule": "schedule",
    "django_celery_beat.crontabschedule": "calendar_month",
    "django_celery_beat.intervalschedule": "timer",
    "django_celery_beat.periodictask": "sync",
    "django_celery_beat.solarschedule": "sunny",
    "django_celery_results.groupresult": "format_list_bulleted",
    "django_celery_results.taskresult": "data_check",
    "token_blacklist.blacklistedtoken": "block",
    "token_blacklist.outstandingtoken": "key",
}

APP_ICONS = {
    "accounts": "manage_accounts",
    "auth": "shield_person",
    "blogs": "article",
    "donations": "volunteer_activism",
    "donors": "handshake",
    "elearning": "school",
    "events": "event",
    "gallery": "photo_library",
    "notifications": "notifications",
    "organization": "corporate_fare",
    "programs": "diversity_3",
    "volunteers": "group",
}


def sidebar_navigation(request):
    """Build icon navigation from models the current user is allowed to view."""
    navigation = [
        {
            "title": _("Navigation"),
            "items": [
                {
                    "title": _("Dashboard"),
                    "icon": "dashboard",
                    "link": reverse("admin:index"),
                },
            ],
        },
    ]

    for app in admin.site.get_app_list(request):
        items = []
        for model in app["models"]:
            label = model["model"]._meta.label_lower
            items.append(
                {
                    "title": model["name"],
                    "icon": MODEL_ICONS.get(
                        label, APP_ICONS.get(app["app_label"], "database")
                    ),
                    "link": model["admin_url"],
                }
            )

        if items:
            navigation.append(
                {
                    "title": app["name"],
                    "collapsible": True,
                    "items": items,
                }
            )

    return navigation
