from rest_framework import serializers

from apps.accounts.api.serializers import UserPublicSerializer
from apps.content.models import Article, Category, Tag, Comment, Resource
from apps.programs.models import Topic


class ArticleTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ["id", "name", "slug", "parent"]
        read_only_fields = fields


class ResourceSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = [
            "id", "title", "slug", "description", "category",
            "file_url", "published_at", "created_at",
        ]
        read_only_fields = fields

    def get_file_url(self, obj):
        if not obj.file:
            return None
        url = obj.file.url
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request and url.startswith("/") else url


class NewsletterSubscriptionSerializer(serializers.Serializer):
    email = serializers.EmailField()


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------


class CategorySerializer(serializers.ModelSerializer):
    article_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "color",
            "is_active",
            "article_count",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_article_count(self, obj):
        if hasattr(obj, "_published_article_count"):
            return obj._published_article_count
        return obj.articles.filter(
            status=Article.Status.PUBLISHED, deleted_at__isnull=True
        ).count()


# ---------------------------------------------------------------------------
# Tag
# ---------------------------------------------------------------------------


class TagSerializer(serializers.ModelSerializer):
    article_count = serializers.SerializerMethodField()

    class Meta:
        model = Tag
        fields = ["id", "name", "slug", "article_count"]
        read_only_fields = ["id"]

    def get_article_count(self, obj):
        if hasattr(obj, "_published_article_count"):
            return obj._published_article_count
        return obj.articles.filter(
            status=Article.Status.PUBLISHED, deleted_at__isnull=True
        ).count()


# ---------------------------------------------------------------------------
# Comment
# ---------------------------------------------------------------------------


class ReplySerializer(serializers.ModelSerializer):
    """Flat reply — no further nesting."""

    author = UserPublicSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "author", "body", "is_pinned", "created_at", "updated_at"]
        read_only_fields = ["id", "author", "is_pinned", "created_at", "updated_at"]


class CommentSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    reply_count = serializers.ReadOnlyField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "article",
            "author",
            "parent",
            "body",
            "is_approved",
            "is_pinned",
            "replies",
            "reply_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "author",
            "is_approved",
            "is_pinned",
            "created_at",
            "updated_at",
        ]

    def get_replies(self, obj):
        # Only show replies on top-level comments
        if obj.parent_id:
            return []
        qs = obj.replies.filter(is_approved=True, deleted_at__isnull=True).order_by(
            "created_at"
        )
        return ReplySerializer(qs, many=True).data

    def validate(self, attrs):
        parent = attrs.get("parent")
        article = attrs.get("article")
        # Ensure reply parent belongs to the same article
        if parent and parent.article_id != (article.id if article else None):
            raise serializers.ValidationError(
                {"parent": "Parent comment must belong to the same article."}
            )
        # Disallow replying to a reply (max one level deep)
        if parent and parent.parent_id is not None:
            raise serializers.ValidationError(
                {"parent": "Replies to replies are not allowed."}
            )
        return attrs

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)


class CommentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["article", "parent", "body"]

    def validate(self, attrs):
        return CommentSerializer.validate(self, attrs)

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)


# ---------------------------------------------------------------------------
# Article — list (lightweight card)
# ---------------------------------------------------------------------------


class ArticleListSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    topics = ArticleTopicSerializer(many=True, read_only=True)
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "cover_image",
            "cover_image_alt",
            "author",
            "category",
            "tags",
            "topics",
            "status",
            "is_featured",
            "published_at",
            "reading_time_minutes",
            "view_count",
            "like_count",
            "comment_count",
            "is_liked",
            "is_bookmarked",
            "created_at",
        ]
        read_only_fields = fields

    def get_is_liked(self, obj):
        if hasattr(obj, "_is_liked"):
            return obj._is_liked
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_is_bookmarked(self, obj):
        if hasattr(obj, "_is_bookmarked"):
            return obj._is_bookmarked
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(user=request.user).exists()
        return False

    def get_like_count(self, obj):
        if hasattr(obj, "_like_count"):
            return obj._like_count
        return obj.like_count

    def get_comment_count(self, obj):
        if hasattr(obj, "_comment_count"):
            return obj._comment_count
        return obj.comment_count


# ---------------------------------------------------------------------------
# Article — detail (full body + comments)
# ---------------------------------------------------------------------------


class ArticleDetailSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    topics = ArticleTopicSerializer(many=True, read_only=True)
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "body",
            "cover_image",
            "cover_image_alt",
            "author",
            "category",
            "tags",
            "topics",
            "program",
            "status",
            "is_featured",
            "published_at",
            "reading_time_minutes",
            "view_count",
            "like_count",
            "comment_count",
            "meta_title",
            "meta_description",
            "is_liked",
            "is_bookmarked",
            "comments",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_is_liked(self, obj):
        if hasattr(obj, "_is_liked"):
            return obj._is_liked
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_is_bookmarked(self, obj):
        if hasattr(obj, "_is_bookmarked"):
            return obj._is_bookmarked
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(user=request.user).exists()
        return False

    def get_like_count(self, obj):
        if hasattr(obj, "_like_count"):
            return obj._like_count
        return obj.like_count

    def get_comment_count(self, obj):
        if hasattr(obj, "_comment_count"):
            return obj._comment_count
        return obj.comment_count

    def get_comments(self, obj):
        # Top-level approved comments only; replies nested inside CommentSerializer
        qs = (
            obj.comments.filter(
                is_approved=True, parent__isnull=True, deleted_at__isnull=True
            )
            .select_related("author")
            .prefetch_related("replies__author")
            .order_by("-is_pinned", "created_at")
        )
        return CommentSerializer(qs, many=True, context=self.context).data


# ---------------------------------------------------------------------------
# Article — write (create / update)
# ---------------------------------------------------------------------------


class ArticleWriteSerializer(serializers.ModelSerializer):
    tag_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False, default=list
    )

    class Meta:
        model = Article
        fields = [
            "title",
            "slug",
            "excerpt",
            "body",
            "cover_image",
            "cover_image_alt",
            "category",
            "tag_ids",
            "program",
            "status",
            "is_featured",
            "meta_title",
            "meta_description",
        ]

    def validate_slug(self, value):
        from django.utils.text import slugify

        return slugify(value) if value else value

    def validate_status(self, value):
        """Only admins/staff can publish directly; authors go to review."""
        request = self.context.get("request")
        if value == Article.Status.PUBLISHED:
            if request and request.user.role not in ("admin", "staff"):
                raise serializers.ValidationError(
                    "Only staff or admin can publish articles directly."
                )
        return value

    def _set_tags(self, instance, tag_ids):
        if tag_ids is not None:
            tags = Tag.objects.filter(id__in=tag_ids)
            instance.tags.set(tags)

    def create(self, validated_data):
        tag_ids = validated_data.pop("tag_ids", [])
        validated_data["author"] = self.context["request"].user
        article = super().create(validated_data)
        self._set_tags(article, tag_ids)
        return article

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop("tag_ids", None)
        article = super().update(instance, validated_data)
        self._set_tags(article, tag_ids)
        return article


# ---------------------------------------------------------------------------
# Like / Bookmark response
# ---------------------------------------------------------------------------


class ToggleResponseSerializer(serializers.Serializer):
    liked = serializers.BooleanField(required=False)
    bookmarked = serializers.BooleanField(required=False)
    like_count = serializers.IntegerField(required=False)
