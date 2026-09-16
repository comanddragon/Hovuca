from django.urls import reverse
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.blogs.models import Article


class ArticlePermissionTests(APITestCase):
    def setUp(self):
        self.author = User.objects.create_user(
            email="author@example.com",
            password="test-password",
            first_name="Article",
            last_name="Author",
        )
        self.article = Article.objects.create(
            author=self.author,
            title="Published article",
            slug="published-article",
            body="Article body",
            status=Article.Status.PUBLISHED,
        )
        self.url = reverse("article-detail", kwargs={"slug": self.article.slug})

    def test_anonymous_update_returns_auth_error_instead_of_server_error(self):
        response = self.client.patch(
            self.url,
            {"title": "Unauthorized edit"},
            format="json",
        )

        self.assertIn(response.status_code, (401, 403))
        self.article.refresh_from_db()
        self.assertEqual(self.article.title, "Published article")
