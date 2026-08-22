import bleach
from bleach.css_sanitizer import CSSSanitizer
from django.db import models
from django.utils.text import slugify
from apps.core.models import BaseModel

ARTICLE_BODY_ALLOWED_TAGS = [
    "p", "br", "hr",
    "h1", "h2", "h3", "h4",
    "strong", "em", "u", "s",
    "ul", "ol", "li",
    "blockquote", "a", "img",
    "code", "pre",
]

ARTICLE_BODY_ALLOWED_ATTRS = {
    "a": ["href", "title", "target", "rel"],
    "img": ["src", "alt", "style", "width", "height"],
    "*": ["class"],
}

ARTICLE_BODY_ALLOWED_STYLES = ["width", "height"]


class Category(BaseModel):
    """Top-level blog category (e.g. 'News', 'Education', 'Stories')."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(
        max_length=7, default="#3B82F6", help_text="Hex color for UI badges."
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "blog_categories"
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Tag(BaseModel):
    """Freeform tag for cross-cutting article topics."""

    name = models.CharField(max_length=60, unique=True)
    slug = models.SlugField(unique=True)

    class Meta:
        db_table = "blog_tags"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Article(BaseModel):
    """A blog article / post."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        REVIEW = "review", "In Review"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    # Authorship
    author = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="articles",
    )

    # Classification
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="articles",
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name="articles")

    # Content
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=280)
    excerpt = models.TextField(
        max_length=500, blank=True, help_text="Short summary shown in listing cards."
    )
    body = models.TextField(help_text="Full article body. Supports Markdown / HTML.")
    cover_image = models.ImageField(upload_to="blog/covers/", null=True, blank=True)
    cover_image_alt = models.CharField(max_length=255, blank=True)

    # Publishing
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.DRAFT
    )
    is_featured = models.BooleanField(
        default=False, help_text="Pin to homepage / featured section."
    )
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)

    # SEO
    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)

    # Counters (denormalised for performance)
    view_count = models.PositiveIntegerField(default=0)
    reading_time_minutes = models.PositiveSmallIntegerField(
        default=0, help_text="Auto-calculated on save."
    )

    # Related program / project (optional)
    program = models.ForeignKey(
        "programs.Program",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="articles",
    )

    class Meta:
        db_table = "blog_articles"
        ordering = ["-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["status", "published_at"]),
            models.Index(fields=["author", "status"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        if self.body:
            self.body = bleach.clean(
                self.body,
                tags=ARTICLE_BODY_ALLOWED_TAGS,
                attributes=ARTICLE_BODY_ALLOWED_ATTRS,
                css_sanitizer=CSSSanitizer(
                    allowed_css_properties=ARTICLE_BODY_ALLOWED_STYLES
                ),
                strip=True,
            )
        # Auto-calculate reading time (avg 200 words/min)
        word_count = len(self.body.split())
        self.reading_time_minutes = max(1, round(word_count / 200))
        super().save(*args, **kwargs)

    @property
    def is_published(self):
        return self.status == self.Status.PUBLISHED

    @property
    def like_count(self):
        return self.likes.count()

    @property
    def comment_count(self):
        return self.comments.filter(is_approved=True, deleted_at__isnull=True).count()


class Comment(BaseModel):
    """A threaded comment on an Article. Supports one level of replies."""

    article = models.ForeignKey(
        Article, on_delete=models.CASCADE, related_name="comments"
    )
    author = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="blog_comments",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
        help_text="Set for replies; leave blank for top-level comments.",
    )
    body = models.TextField(max_length=2000)
    is_approved = models.BooleanField(default=True)
    is_pinned = models.BooleanField(default=False)

    class Meta:
        db_table = "blog_comments"
        ordering = ["-is_pinned", "created_at"]
        indexes = [
            models.Index(fields=["article", "is_approved"]),
        ]

    def __str__(self):
        return f"{self.author} on '{self.article.title[:40]}'"

    @property
    def reply_count(self):
        return self.replies.filter(deleted_at__isnull=True).count()


class Like(BaseModel):
    """A user liking an article. One like per user per article."""

    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name="likes")
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="article_likes",
    )

    class Meta:
        db_table = "blog_likes"
        unique_together = [("article", "user")]

    def __str__(self):
        return f"{self.user} ♥ {self.article.title[:40]}"


class Bookmark(BaseModel):
    """A user bookmarking an article for later reading."""

    article = models.ForeignKey(
        Article, on_delete=models.CASCADE, related_name="bookmarks"
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="article_bookmarks",
    )

    class Meta:
        db_table = "blog_bookmarks"
        unique_together = [("article", "user")]

    def __str__(self):
        return f"{self.user} 🔖 {self.article.title[:40]}"