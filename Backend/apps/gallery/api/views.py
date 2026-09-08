from django.db.models import F
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from core.pagination import StandardPagination
from core.permissions import IsAdmin, IsStaffOrAdmin

from apps.gallery.models import GalleryAlbum, GalleryImage
from .serializers import (
    GalleryAlbumListSerializer,
    GalleryAlbumDetailSerializer,
    GalleryAlbumWriteSerializer,
    GalleryImageSerializer,
    GalleryImageWriteSerializer,
)


# ---------------------------------------------------------------------------
# GalleryAlbum
# ---------------------------------------------------------------------------


class GalleryAlbumViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/gallery/albums/               [public — published only]
    POST   /api/v1/gallery/albums/               [staff/admin]
    GET    /api/v1/gallery/albums/{slug}/         [public]
    PATCH  /api/v1/gallery/albums/{slug}/         [staff/admin]
    DELETE /api/v1/gallery/albums/{slug}/         [admin]

    Actions:
    POST   /api/v1/gallery/albums/{slug}/publish/   [staff/admin]
    GET    /api/v1/gallery/albums/featured/          [public]

    Filters: ?program=<slug>  ?event=<slug>  ?is_featured=true  ?search=<str>
    """

    lookup_field = "slug"
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ("list", "retrieve", "featured"):
            return [AllowAny()]
        if self.action in ("create", "update", "partial_update", "publish"):
            return [IsStaffOrAdmin()]
        if self.action == "destroy":
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return GalleryAlbumWriteSerializer
        if self.action == "retrieve":
            return GalleryAlbumDetailSerializer
        return GalleryAlbumListSerializer

    def get_queryset(self):
        qs = (
            GalleryAlbum.objects.filter(deleted_at__isnull=True)
            .select_related("created_by", "event", "program")
            .prefetch_related("images")
        )

        user = self.request.user
        if not (user.is_authenticated and user.role in ("admin", "staff")):
            qs = qs.filter(is_published=True)

        # Filters
        program = self.request.query_params.get("program")
        event = self.request.query_params.get("event")
        is_featured = self.request.query_params.get("is_featured")
        search = self.request.query_params.get("search")

        if program:
            qs = qs.filter(program__slug=program)
        if event:
            qs = qs.filter(event__slug=event)
        if is_featured is not None:
            qs = qs.filter(is_featured=is_featured.lower() == "true")
        if search:
            qs = qs.filter(title__icontains=search) | qs.filter(
                description__icontains=search
            )

        return qs.distinct().order_by("-taken_at", "-created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=["post"], permission_classes=[IsStaffOrAdmin])
    def publish(self, request, slug=None):
        album = self.get_object()
        album.is_published = not album.is_published
        album.save(update_fields=["is_published"])
        state = "published" if album.is_published else "unpublished"
        return Response({"detail": f"Album '{album.title}' is now {state}.", "is_published": album.is_published})

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def featured(self, request):
        """GET /api/v1/gallery/albums/featured/ — up to 6 featured published albums."""
        qs = (
            GalleryAlbum.objects.filter(
                is_published=True,
                is_featured=True,
                deleted_at__isnull=True,
            )
            .select_related("created_by")
            .prefetch_related("images")
            .order_by("-taken_at", "-created_at")[:6]
        )
        serializer = GalleryAlbumListSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# GalleryImage
# ---------------------------------------------------------------------------


class GalleryImageViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/gallery/images/              [public — images from published albums]
    POST   /api/v1/gallery/images/              [staff/admin]
    GET    /api/v1/gallery/images/{id}/         [public]
    PATCH  /api/v1/gallery/images/{id}/         [staff/admin]
    DELETE /api/v1/gallery/images/{id}/         [admin]

    Filters: ?album=<slug>  ?is_featured=true  ?tags=<str>
    """

    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        if self.action in ("create", "update", "partial_update"):
            return [IsStaffOrAdmin()]
        if self.action == "destroy":
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return GalleryImageWriteSerializer
        return GalleryImageSerializer

    def get_queryset(self):
        qs = (
            GalleryImage.objects.filter(deleted_at__isnull=True)
            .select_related("album", "uploaded_by")
        )

        user = self.request.user
        if not (user.is_authenticated and user.role in ("admin", "staff")):
            qs = qs.filter(album__is_published=True)

        album_slug = self.request.query_params.get("album")
        is_featured = self.request.query_params.get("is_featured")
        tags = self.request.query_params.get("tags")

        if album_slug:
            qs = qs.filter(album__slug=album_slug)
        if is_featured is not None:
            qs = qs.filter(is_featured=is_featured.lower() == "true")
        if tags:
            qs = qs.filter(tags__contains=[tags])

        return qs.order_by("album", "order", "created_at")

    def retrieve(self, request, *args, **kwargs):
        """Increment view_count."""
        instance = self.get_object()
        GalleryImage.objects.filter(pk=instance.pk).update(
            view_count=F("view_count") + 1
        )
        instance.refresh_from_db(fields=["view_count"])
        return Response(self.get_serializer(instance).data)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()