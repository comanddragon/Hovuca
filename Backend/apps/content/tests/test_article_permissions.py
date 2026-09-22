from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.content.models import Article, Category, Comment, Tag
from apps.programs.models import Topic


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

    def test_article_list_does_not_query_related_data_per_article(self):
        category = Category.objects.create(name="News", slug="news")
        tag = Tag.objects.create(name="Health", slug="health")
        topic = Topic.objects.create(name="Wellbeing", slug="wellbeing")

        for number in range(3):
            article = Article.objects.create(
                author=self.author,
                category=category,
                title=f"Article {number}",
                slug=f"article-{number}",
                body="Article body",
                status=Article.Status.PUBLISHED,
            )
            article.tags.add(tag)
            article.topics.add(topic)
            Comment.objects.create(
                article=article,
                author=self.author,
                body="Approved comment",
                is_approved=True,
            )

        with CaptureQueriesContext(connection) as queries:
            response = self.client.get(reverse("article-list"))

        self.assertEqual(response.status_code, 200)
        sql = [query["sql"] for query in queries.captured_queries]
        self.assertLessEqual(
            sum('FROM "topics"' in query for query in sql),
            1,
        )
        self.assertFalse(
            any(
                'SELECT COUNT(*) AS "__count" FROM "blog_comments"' in query
                for query in sql
            )
        )
        self.assertFalse(
            any(
                'SELECT COUNT(*) AS "__count" FROM "blog_articles"' in query
                and '"category_id"' in query
                for query in sql
            )
        )
