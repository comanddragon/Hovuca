"""Send one safe, sample-only preview of every transactional email."""

from decimal import Decimal
from types import SimpleNamespace

import resend
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.template.loader import render_to_string
from django.utils import timezone


class DisplayValue(SimpleNamespace):
    def get_full_name(self):
        return getattr(self, "full_name", "")

    def get_topic_display(self):
        return getattr(self, "topic_display", "General enquiry")

    def get_difficulty_display(self):
        return getattr(self, "difficulty_display", "Beginner")


class Command(BaseCommand):
    help = "Send sample previews of every HOVUCA email template through Resend."

    def add_arguments(self, parser):
        parser.add_argument("--to", default="ntsemancho@gmail.com")
        parser.add_argument(
            "--confirm",
            action="store_true",
            help="Required acknowledgement that this command sends real email.",
        )

    def handle(self, *args, **options):
        recipient = options["to"]
        if not options["confirm"]:
            raise CommandError(
                f"No email sent. Re-run with --confirm to send all previews to {recipient}."
            )
        if not settings.RESEND_API_KEY:
            raise CommandError("RESEND_API_KEY is not configured.")

        frontend_url = "https://hovuca.org"
        now = timezone.now()
        user = DisplayValue(
            first_name="Ntse",
            full_name="Ntse Mancho",
            email=recipient,
        )
        course = DisplayValue(
            title="Community Leadership Foundations",
            slug="community-leadership-foundations",
            subject=SimpleNamespace(name="Leadership"),
            estimated_hours=6,
            difficulty_display="Beginner",
        )
        article = DisplayValue(
            title="How community-led action creates lasting change",
            slug="community-led-action-lasting-change",
            excerpt=(
                "Meet the people turning local knowledge into practical, "
                "lasting progress across their communities."
            ),
            category=SimpleNamespace(name="Community stories"),
            reading_time_minutes=5,
            author=DisplayValue(full_name="HOVUCA Editorial Team"),
        )
        campaign = DisplayValue(
            title="Learning Kits for Young Leaders",
            slug="learning-kits-young-leaders",
            goal_amount=Decimal("5000000.00"),
            raised_amount=Decimal("5000000.00"),
            progress_percentage=100,
        )
        donation = DisplayValue(
            id="HOVUCA-PREVIEW-2026",
            amount=Decimal("25000.00"),
            currency="XAF",
            created_at=now,
        )
        task = DisplayValue(
            title="Welcome new programme participants",
            description=(
                "Help the programme team welcome participants and prepare "
                "their learning materials for the first session."
            ),
            project="Youth Leadership Programme",
            due_date=now.date(),
        )
        contact_message = DisplayValue(
            full_name="Amina Example",
            email="amina@example.com",
            phone="+237 600 000 000",
            topic_display="Partnership",
            subject="Exploring a community partnership",
            message=(
                "Hello HOVUCA team,\n\nI would like to discuss a possible "
                "partnership for an upcoming community programme."
            ),
            created_at=now,
        )

        common = {"frontend_url": frontend_url}
        previews = [
            ("Welcome", "emails/accounts/welcome.html", {**common, "user": user, "login_url": f"{frontend_url}/login"}),
            ("Verify email", "emails/accounts/email_verification.html", {**common, "user": user, "verify_url": f"{frontend_url}/verify-email?token=preview"}),
            ("Reset password", "emails/accounts/password_reset.html", {**common, "user": user, "reset_url": f"{frontend_url}/reset-password?token=preview"}),
            ("Password changed", "emails/accounts/password_changed.html", common),
            ("Contact form", "emails/organization/contact_message.html", {**common, "contact_message": contact_message}),
            ("New article", "accounts/blog/new_article.html", {**common, "article": article}),
            ("Donation receipt", "accounts/donations/receipt.html", {**common, "donor": user, "donation": donation, "campaign": campaign}),
            ("Campaign goal reached", "accounts/donations/goal_reached.html", {**common, "campaign": campaign}),
            ("Volunteer task", "accounts/volunteers/task_assigned.html", {**common, "user": user, "task": task}),
            ("Course enrollment", "accounts/elearning/enrollment_confirmation.html", {**common, "user": user, "course": course}),
            ("Course completed", "accounts/elearning/course_completed.html", {**common, "user": user, "course": course}),
            ("Course certificate", "accounts/elearning/certificate.html", {**common, "user": user, "course": course, "certificate_url": f"{frontend_url}/preview-certificate.pdf", "completed_at": now}),
        ]

        resend.api_key = settings.RESEND_API_KEY
        for name, template, context in previews:
            html = render_to_string(template, context)
            resend.Emails.send(
                {
                    "from": settings.RESEND_FROM,
                    "to": recipient,
                    "subject": f"[HOVUCA email preview] {name}",
                    "html": html,
                }
            )
            self.stdout.write(self.style.SUCCESS(f"Sent: {name}"))

        self.stdout.write(
            self.style.SUCCESS(f"Sent {len(previews)} email previews to {recipient}.")
        )
