from datetime import date

from django.test import SimpleTestCase
from rest_framework.test import APITestCase

from apps.elearning.audience import age_from_date_of_birth
from apps.accounts.models import User
from apps.elearning.models.course import Course, Subject
from apps.elearning.models.module import Module


class AgeFromDateOfBirthTests(SimpleTestCase):
    def test_age_before_birthday_excludes_the_unreached_year(self):
        self.assertEqual(
            age_from_date_of_birth(date(2013, 10, 1), today=date(2026, 9, 22)),
            12,
        )

    def test_age_on_birthday_includes_the_new_year(self):
        self.assertEqual(
            age_from_date_of_birth(date(2013, 9, 22), today=date(2026, 9, 22)),
            13,
        )


class CourseAudienceFilteringTests(APITestCase):
    def setUp(self):
        today = date.today()
        self.today = today
        self.subject = Subject.objects.create(name="CSE", slug="cse")
        self.course = Course.objects.create(
            subject=self.subject,
            title="CSE foundations",
            slug="cse-foundations",
            is_published=True,
        )
        self.younger_module = Module.objects.create(
            course=self.course,
            title="Module 1: Relationship",
            order=1,
            age_min=10,
            age_max=15,
        )
        self.older_module = Module.objects.create(
            course=self.course,
            title="Module 1: Relationship",
            order=2,
            age_min=15,
            age_max=None,
        )
        self.user = User.objects.create_user(
            email="learner@example.com",
            password="A-secure-test-password-2026!",
            first_name="Course",
            last_name="Learner",
            date_of_birth=date(today.year - 13, today.month, today.day),
        )

    def test_course_detail_returns_only_modules_matching_the_learner_age(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/v1/courses/{self.course.slug}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["learner_age"], 13)
        self.assertTrue(response.data["modules_are_age_filtered"])
        self.assertEqual([item["id"] for item in response.data["modules"]], [str(self.younger_module.id)])

    def test_course_detail_keeps_all_modules_for_anonymous_visitors(self):
        response = self.client.get(f"/api/v1/courses/{self.course.slug}/")

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data["learner_age"])
        self.assertFalse(response.data["modules_are_age_filtered"])
        self.assertEqual(len(response.data["modules"]), 2)

    def test_course_detail_filters_staff_previews_by_birthday_too(self):
        self.user.role = User.Role.STAFF
        self.user.save(update_fields=["role"])
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/v1/courses/{self.course.slug}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["learner_age"], 13)
        self.assertEqual([item["id"] for item in response.data["modules"]], [str(self.younger_module.id)])

    def test_age_band_boundary_prefers_the_older_version_of_a_duplicate_module(self):
        self.user.date_of_birth = date(
            self.today.year - 15, self.today.month, self.today.day
        )
        self.user.save(update_fields=["date_of_birth"])
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/v1/courses/{self.course.slug}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data["modules"]], [str(self.older_module.id)])
