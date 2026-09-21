from django.contrib import admin
from django import forms
from django.utils import timezone
from django.utils.html import format_html
from django.urls import reverse
from unfold.admin import ModelAdmin, TabularInline

from core.widgets import AdminCKEditor5Widget

from .models import Article, Bookmark, Category, Comment, Like, NewsletterSubscriber, Resource, Tag


class ArticleAdminForm(forms.ModelForm):
    class Meta:
        model = Article
        fields = "__all__"
        widgets = {"body": AdminCKEditor5Widget(config_name="hovuca")}


@admin.register(Resource)
class ResourceAdmin(ModelAdmin):
    list_display = ["title", "category", "published_at", "is_active"]
    list_filter = ["category", "is_active"]
    search_fields = ["title", "description"]
    prepopulated_fields = {"slug": ("title",)}


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(ModelAdmin):
    list_display = ["email", "is_active", "source", "created_at"]
    list_filter = ["is_active", "source"]
    search_fields = ["email"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = [
        "name",
        "slug",
        "color_badge",
        "article_count",
        "is_active",
        "created_at",
    ]
    list_filter = ["is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["created_at", "updated_at"]

    def color_badge(self, obj):
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;">{}</span>',
            obj.color,
            obj.color,
        )

    color_badge.short_description = "Color"

    def article_count(self, obj):
        return obj.articles.filter(status=Article.Status.PUBLISHED).count()

    article_count.short_description = "Published Articles"


@admin.register(Tag)
class TagAdmin(ModelAdmin):
    list_display = ["name", "slug", "article_count"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ("name",)}

    def article_count(self, obj):
        return obj.articles.count()

    article_count.short_description = "Articles"


class CommentInline(TabularInline):
    model = Comment
    fk_name = "article"
    fields = ["author", "body", "is_approved", "is_pinned", "created_at"]
    readonly_fields = ["author", "created_at"]
    extra = 0
    show_change_link = True
    can_delete = True


@admin.register(Article)
class ArticleAdmin(ModelAdmin):
    form = ArticleAdminForm
    list_display = [
        "thumbnail",
        "title",
        "author",
        "category",
        "status_badge",
        "is_featured",
        "view_count",
        "like_count_display",
        "reading_time_minutes",
        "published_at",
        "created_at",
        "edit_link",
    ]
    list_display_links = ["title"]
    list_filter = ["status", "is_featured", "category", "created_at", "published_at"]
    search_fields = ["title", "slug", "excerpt", "body", "author__email"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = [
        "view_count",
        "reading_time_minutes",
        "like_count_display",
        "comment_count_display",
        "created_at",
        "updated_at",
    ]
    filter_horizontal = ["tags"]
    date_hierarchy = "published_at"
    inlines = [CommentInline]

    fieldsets = (
        (
            "Content",
            {
                "fields": (
                    "title",
                    "slug",
                    "excerpt",
                    "body",
                    "cover_image",
                    "cover_image_alt",
                ),
            },
        ),
        (
            "Classification",
            {
                "fields": ("author", "category", "tags", "program"),
            },
        ),
        (
            "Publishing",
            {
                "fields": ("status", "is_featured", "published_at"),
            },
        ),
        (
            "SEO",
            {
                "classes": ("collapse",),
                "fields": ("meta_title", "meta_description"),
            },
        ),
        (
            "Stats",
            {
                "classes": ("collapse",),
                "fields": (
                    "view_count",
                    "reading_time_minutes",
                    "like_count_display",
                    "comment_count_display",
                ),
            },
        ),
        (
            "Timestamps",
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    actions = [
        "publish_articles",
        "archive_articles",
        "feature_articles",
        "unfeature_articles",
    ]

    @admin.display(description="")
    def thumbnail(self, obj):
        if not obj.cover_image:
            return ""
        return format_html(
            '<img src="{}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;" />',
            obj.cover_image.url,
        )

    @admin.display(description="Edit")
    def edit_link(self, obj):
        url = reverse("admin:blogs_article_change", args=[obj.pk])
        return format_html('<a class="button" href="{}">Edit article</a>', url)

    def status_badge(self, obj):
        colors = {
            "draft": "#6B7280",
            "review": "#F59E0B",
            "published": "#10B981",
            "archived": "#EF4444",
        }
        color = colors.get(obj.status, "#6B7280")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"

    def like_count_display(self, obj):
        return obj.likes.count()

    like_count_display.short_description = "Likes"

    def comment_count_display(self, obj):
        return obj.comments.filter(is_approved=True).count()

    comment_count_display.short_description = "Approved Comments"

    @admin.action(description="Publish selected articles")
    def publish_articles(self, request, queryset):
        updated = queryset.update(
            status=Article.Status.PUBLISHED, published_at=timezone.now()
        )
        self.message_user(request, f"{updated} article(s) published.")

    @admin.action(description="Archive selected articles")
    def archive_articles(self, request, queryset):
        updated = queryset.update(status=Article.Status.ARCHIVED)
        self.message_user(request, f"{updated} article(s) archived.")

    @admin.action(description="Mark as featured")
    def feature_articles(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f"{updated} article(s) featured.")

    @admin.action(description="Remove from featured")
    def unfeature_articles(self, request, queryset):
        updated = queryset.update(is_featured=False)
        self.message_user(request, f"{updated} article(s) removed from featured.")


@admin.register(Comment)
class CommentAdmin(ModelAdmin):
    list_display = [
        "short_body",
        "author",
        "article",
        "is_approved",
        "is_pinned",
        "created_at",
    ]
    list_filter = ["is_approved", "is_pinned", "created_at"]
    search_fields = ["body", "author__email", "article__title"]
    readonly_fields = ["created_at", "updated_at"]
    actions = ["approve_comments", "unapprove_comments"]

    def short_body(self, obj):
        return obj.body[:80] + ("…" if len(obj.body) > 80 else "")

    short_body.short_description = "Body"

    @admin.action(description="Approve selected comments")
    def approve_comments(self, request, queryset):
        queryset.update(is_approved=True)

    @admin.action(description="Unapprove selected comments")
    def unapprove_comments(self, request, queryset):
        queryset.update(is_approved=False)


@admin.register(Like)
class LikeAdmin(ModelAdmin):
    list_display = ["user", "article", "created_at"]
    search_fields = ["user__email", "article__title"]
    readonly_fields = ["created_at"]


@admin.register(Bookmark)
class BookmarkAdmin(ModelAdmin):
    list_display = ["user", "article", "created_at"]
    search_fields = ["user__email", "article__title"]
    readonly_fields = ["created_at"]
