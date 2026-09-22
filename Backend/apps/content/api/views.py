import uuid

from django.core.files.storage import default_storage
from django.db import transaction
from django.db.models import BooleanField, Count, Exists, OuterRef, Prefetch, Q, Value
from django.utils import timezone
from PIL import Image, UnidentifiedImageError
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from core.pagination import StandardPagination
from core.permissions import IsAdmin, IsStaffOrAdmin, IsOwnerOrAdmin

from apps.content.models import Article, Category, Tag, Comment, Like, Bookmark, NewsletterSubscriber, Resource
from .serializers import (
    ArticleListSerializer,
    ArticleDetailSerializer,
    ArticleWriteSerializer,
    CategorySerializer,
    TagSerializer,
    CommentSerializer,
    CommentWriteSerializer,
    NewsletterSubscriptionSerializer,
    ResourceSerializer,
)

MAX_INLINE_IMAGE_BYTES = 5 * 1024 * 1024  # 5MB
ALLOWED_INLINE_IMAGE_FORMATS = {"JPEG": "jpg", "PNG": "png", "GIF": "gif", "WEBP": "webp"}


@api_view(["POST"])
@permission_classes([AllowAny])
def subscribe_newsletter(request):
    serializer = NewsletterSubscriptionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"].strip().lower()
    subscriber, created = NewsletterSubscriber.all_objects.get_or_create(
        email=email,
        defaults={"is_active": True, "source": "website"},
    )
    if not created and not subscriber.is_active:
        subscriber.is_active = True
        subscriber.deleted_at = None
        subscriber.save(update_fields=["is_active", "deleted_at", "updated_at"])
    return Response(
        {"detail": "You are subscribed to HOVUCA updates."},
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


class ResourceViewSet(viewsets.ReadOnlyModelViewSet):
    """Public list and detail endpoints for downloadable resources."""

    queryset = Resource.objects.filter(is_active=True).order_by("-published_at", "title")
    serializer_class = ResourceSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    pagination_class = None


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------


class CategoryViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/blog/categories/         [public]
    POST   /api/v1/blog/categories/         [admin]
    GET    /api/v1/blog/categories/{id}/    [public]
    PATCH  /api/v1/blog/categories/{id}/    [admin]
    DELETE /api/v1/blog/categories/{id}/    [admin]
    """

    queryset = Category.objects.filter(deleted_at__isnull=True).order_by("name")
    serializer_class = CategorySerializer
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get("is_active"):
            val = self.request.query_params["is_active"].lower() == "true"
            qs = qs.filter(is_active=val)
        return qs

    def perform_destroy(self, instance):
        instance.soft_delete()


# ---------------------------------------------------------------------------
# Tag
# ---------------------------------------------------------------------------


class TagViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/blog/tags/         [public]
    POST   /api/v1/blog/tags/         [staff/admin]
    GET    /api/v1/blog/tags/{id}/    [public]
    PATCH  /api/v1/blog/tags/{id}/    [staff/admin]
    DELETE /api/v1/blog/tags/{id}/    [admin]
    """

    queryset = Tag.objects.filter(deleted_at__isnull=True).order_by("name")
    serializer_class = TagSerializer
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        if self.action == "destroy":
            return [IsAdmin()]
        return [IsStaffOrAdmin()]

    def perform_destroy(self, instance):
        instance.soft_delete()


# ---------------------------------------------------------------------------
# Article
# ---------------------------------------------------------------------------


class ArticleViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/blog/articles/                  [public — published only]
    POST   /api/v1/blog/articles/                  [authenticated]
    GET    /api/v1/blog/articles/{slug}/            [public]
    PATCH  /api/v1/blog/articles/{slug}/            [author | staff/admin]
    DELETE /api/v1/blog/articles/{slug}/            [author | admin]

    Actions:
    POST   /api/v1/blog/articles/{slug}/like/       [authenticated]
    POST   /api/v1/blog/articles/{slug}/bookmark/   [authenticated]
    POST   /api/v1/blog/articles/{slug}/publish/    [staff/admin]
    POST   /api/v1/blog/articles/{slug}/archive/    [staff/admin]
    GET    /api/v1/blog/articles/featured/          [public]
    GET    /api/v1/blog/articles/my-articles/       [authenticated]
    POST   /api/v1/blog/articles/upload-image/      [staff/admin]

    Filters: ?category=<slug>  ?tag=<slug>  ?author=<uuid>  ?search=<str>
             ?status=<str>  ?is_featured=true
    """

    lookup_field = "slug"
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ("list", "retrieve", "featured"):
            return [AllowAny()]
        if self.action in ("publish", "archive"):
            return [IsStaffOrAdmin()]
        if self.action in ("update", "partial_update"):
            return [(IsStaffOrAdmin | IsOwnerOrAdmin)()]
        if self.action == "destroy":
            return [IsOwnerOrAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ArticleWriteSerializer
        if self.action == "retrieve":
            return ArticleDetailSerializer
        return ArticleListSerializer

    def get_queryset(self):
        user = self.request.user
        published_articles = Q(
            articles__status=Article.Status.PUBLISHED,
            articles__deleted_at__isnull=True,
        )
        category_queryset = Category.all_objects.annotate(
            _published_article_count=Count(
                "articles", filter=published_articles, distinct=True
            )
        )
        tag_queryset = Tag.objects.annotate(
            _published_article_count=Count(
                "articles", filter=published_articles, distinct=True
            )
        )
        qs = (
            Article.objects.filter(deleted_at__isnull=True)
            .select_related("author", "program")
            .prefetch_related(
                Prefetch("category", queryset=category_queryset),
                Prefetch("tags", queryset=tag_queryset),
                "topics",
            )
            .annotate(
                _like_count=Count("likes", distinct=True),
                _comment_count=Count(
                    "comments",
                    filter=Q(
                        comments__is_approved=True,
                        comments__deleted_at__isnull=True,
                    ),
                    distinct=True,
                ),
            )
        )

        if user.is_authenticated:
            qs = qs.annotate(
                _is_liked=Exists(
                    Like.objects.filter(article=OuterRef("pk"), user=user)
                ),
                _is_bookmarked=Exists(
                    Bookmark.objects.filter(article=OuterRef("pk"), user=user)
                ),
            )
        else:
            qs = qs.annotate(
                _is_liked=Value(False, output_field=BooleanField()),
                _is_bookmarked=Value(False, output_field=BooleanField()),
            )

        # Public: only published articles
        if not (user.is_authenticated and user.role in ("admin", "staff")):
            # Own drafts are also visible to the author
            if user.is_authenticated:
                qs = qs.filter(
                    models_Q(status=Article.Status.PUBLISHED) | models_Q(author=user)
                )
            else:
                qs = qs.filter(status=Article.Status.PUBLISHED)

        # Filters
        category = self.request.query_params.get("category")
        tag = self.request.query_params.get("tag")
        author_id = self.request.query_params.get("author")
        search = self.request.query_params.get("search")
        article_status = self.request.query_params.get("status")
        is_featured = self.request.query_params.get("is_featured")

        if category:
            qs = qs.filter(category__slug=category)
        if tag:
            qs = qs.filter(tags__slug=tag)
        if author_id:
            qs = qs.filter(author_id=author_id)
        if search:
            qs = qs.filter(title__icontains=search) | qs.filter(
                excerpt__icontains=search
            )
        if article_status and user.is_authenticated and user.role in ("admin", "staff"):
            qs = qs.filter(status=article_status)
        if is_featured is not None:
            qs = qs.filter(is_featured=is_featured.lower() == "true")

        return qs.distinct().order_by("-published_at", "-created_at")

    def retrieve(self, request, *args, **kwargs):
        """Increment view_count on every public read."""
        instance = self.get_object()
        if instance.is_published:
            Article.objects.filter(pk=instance.pk).update(
                view_count=models_F("view_count") + 1
            )
            instance.refresh_from_db(fields=["view_count"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_destroy(self, instance):
        # Only the author or admin may delete
        user = self.request.user
        if instance.author != user and user.role != "admin":
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("You may only delete your own articles.")
        instance.soft_delete()

    # ------------------------------------------------------------------
    # Publish / Archive
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], permission_classes=[IsStaffOrAdmin])
    def publish(self, request, slug=None):
        article = self.get_object()
        article.status = Article.Status.PUBLISHED
        article.published_at = article.published_at or timezone.now()
        article.save(update_fields=["status", "published_at"])
        return Response({"detail": f"'{article.title}' is now published."})

    @action(detail=True, methods=["post"], permission_classes=[IsStaffOrAdmin])
    def archive(self, request, slug=None):
        article = self.get_object()
        article.status = Article.Status.ARCHIVED
        article.save(update_fields=["status"])
        return Response({"detail": f"'{article.title}' has been archived."})

    # ------------------------------------------------------------------
    # Like
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    @transaction.atomic
    def like(self, request, slug=None):
        article = self.get_object()
        like, created = Like.objects.get_or_create(article=article, user=request.user)
        if not created:
            like.delete()
            liked = False
        else:
            liked = True

        like_count = Like.objects.filter(article=article).count()

        return Response({
            "liked": liked,
            "like_count": like_count,
        })
    # ------------------------------------------------------------------
    # Bookmark
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    @transaction.atomic
    def bookmark(self, request, slug=None):
        """Toggle bookmark — POST again to remove."""
        article = self.get_object()
        bookmark, created = Bookmark.objects.get_or_create(
            article=article, user=request.user
        )
        if not created:
            bookmark.delete()
            bookmarked = False
        else:
            bookmarked = True
        return Response({"bookmarked": bookmarked})

    # ------------------------------------------------------------------
    # Inline image upload (rich text editor)
    # ------------------------------------------------------------------

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[IsStaffOrAdmin],
        parser_classes=[MultiPartParser],
    )
    def upload_image(self, request):
        """POST /api/v1/blog/articles/upload-image/ — for inline images in the article body."""
        file = request.FILES.get("file")
        if not file:
            raise ValidationError({"file": "No file provided."})
        if file.size > MAX_INLINE_IMAGE_BYTES:
            raise ValidationError({"file": "Image must be 5MB or smaller."})

        # Verify the bytes are actually a supported image — never trust the
        # client-supplied filename/extension or Content-Type header.
        try:
            img = Image.open(file)
            img_format = img.format
            img.verify()
        except (UnidentifiedImageError, OSError):
            raise ValidationError({"file": "Unsupported image type."})
        if img_format not in ALLOWED_INLINE_IMAGE_FORMATS:
            raise ValidationError({"file": "Unsupported image type."})
        file.seek(0)

        ext = ALLOWED_INLINE_IMAGE_FORMATS[img_format]
        path = default_storage.save(f"blog/inline/{uuid.uuid4()}.{ext}", file)
        url = request.build_absolute_uri(default_storage.url(path))
        return Response({"url": url}, status=status.HTTP_201_CREATED)

    # ------------------------------------------------------------------
    # Featured articles
    # ------------------------------------------------------------------

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def featured(self, request):
        """GET /api/v1/blog/articles/featured/ — up to 6 featured published articles."""
        qs = (
            Article.objects.filter(
                status=Article.Status.PUBLISHED,
                is_featured=True,
                deleted_at__isnull=True,
            )
            .select_related("author", "category")
            .prefetch_related("tags")
            .order_by("-published_at")[:6]
        )
        serializer = ArticleListSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    # ------------------------------------------------------------------
    # My articles (author dashboard)
    # ------------------------------------------------------------------

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my_articles(self, request):
        """GET /api/v1/blog/articles/my-articles/ — own articles across all statuses."""
        qs = (
            Article.objects.filter(author=request.user, deleted_at__isnull=True)
            .select_related("category")
            .prefetch_related("tags")
            .order_by("-created_at")
        )

        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ArticleListSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)
        return Response(
            ArticleListSerializer(qs, many=True, context={"request": request}).data
        )

    # ------------------------------------------------------------------
    # Bookmarked articles
    # ------------------------------------------------------------------

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def bookmarked(self, request):
        """GET /api/v1/blog/articles/bookmarked/ — articles the user has bookmarked."""
        article_ids = Bookmark.objects.filter(user=request.user).values_list(
            "article_id", flat=True
        )
        qs = (
            Article.objects.filter(
                id__in=article_ids,
                status=Article.Status.PUBLISHED,
                deleted_at__isnull=True,
            )
            .select_related("author", "category")
            .prefetch_related("tags")
            .order_by("-published_at")
        )

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ArticleListSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)
        return Response(
            ArticleListSerializer(qs, many=True, context={"request": request}).data
        )


# ---------------------------------------------------------------------------
# Comment
# ---------------------------------------------------------------------------


class CommentViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/blog/comments/            ?article=<uuid>
    POST   /api/v1/blog/comments/            [authenticated]
    PATCH  /api/v1/blog/comments/{id}/       [author | admin]
    DELETE /api/v1/blog/comments/{id}/       [author | admin]
    POST   /api/v1/blog/comments/{id}/approve/  [staff/admin]
    POST   /api/v1/blog/comments/{id}/pin/      [staff/admin]
    """

    pagination_class = StandardPagination
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action == "list":
            return [AllowAny()]
        if self.action in ("approve", "pin"):
            return [IsStaffOrAdmin()]
        if self.action in ("update", "partial_update", "destroy"):
            return [IsOwnerOrAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return CommentWriteSerializer
        return CommentSerializer

    def get_queryset(self):
        qs = (
            Comment.objects.filter(deleted_at__isnull=True)
            .select_related("author", "article")
            .prefetch_related("replies__author")
        )

        article_id = self.request.query_params.get("article")
        if article_id:
            qs = qs.filter(article_id=article_id, parent__isnull=True)

        # Non-staff see only approved comments
        user = self.request.user
        if not (user.is_authenticated and user.role in ("admin", "staff")):
            if user.is_authenticated:
                qs = qs.filter(models_Q(is_approved=True) | models_Q(author=user))
            else:
                qs = qs.filter(is_approved=True)

        return qs.order_by("-is_pinned", "created_at")

    def perform_destroy(self, instance):
        user = self.request.user
        if instance.author != user and user.role != "admin":
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("You may only delete your own comments.")
        instance.soft_delete()

    @action(detail=True, methods=["post"], permission_classes=[IsStaffOrAdmin])
    def approve(self, request, pk=None):
        comment = self.get_object()
        comment.is_approved = not comment.is_approved
        comment.save(update_fields=["is_approved"])
        state = "approved" if comment.is_approved else "unapproved"
        return Response(
            {"detail": f"Comment {state}.", "is_approved": comment.is_approved}
        )

    @action(detail=True, methods=["post"], permission_classes=[IsStaffOrAdmin])
    def pin(self, request, pk=None):
        comment = self.get_object()
        comment.is_pinned = not comment.is_pinned
        comment.save(update_fields=["is_pinned"])
        state = "pinned" if comment.is_pinned else "unpinned"
        return Response({"detail": f"Comment {state}.", "is_pinned": comment.is_pinned})


# ---------------------------------------------------------------------------
# Import helpers used inside methods (avoids module-level circular imports)
# ---------------------------------------------------------------------------

from django.db.models import Q as models_Q, F as models_F  # noqa: E402
