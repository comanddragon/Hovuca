from rest_framework import serializers
from apps.gallery.models import GalleryAlbum, GalleryImage


# ---------------------------------------------------------------------------
# GalleryImage
# ---------------------------------------------------------------------------


class GalleryImageSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(
        source="uploaded_by.get_full_name", read_only=True
    )

    class Meta:
        model = GalleryImage
        fields = [
            "id",
            "album",
            "uploaded_by",
            "uploaded_by_name",
            "image",
            "thumbnail",
            "media_type",
            "title",
            "caption",
            "alt_text",
            "tags",
            "order",
            "is_featured",
            "view_count",
            "created_at",
        ]
        read_only_fields = [
            "id", "uploaded_by", "uploaded_by_name", "view_count", "thumbnail", "created_at"
        ]


class GalleryImageWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryImage
        fields = [
            "album",
            "image",
            "media_type",
            "title",
            "caption",
            "alt_text",
            "tags",
            "order",
            "is_featured",
        ]


# ---------------------------------------------------------------------------
# GalleryAlbum — List
# ---------------------------------------------------------------------------


class GalleryAlbumListSerializer(serializers.ModelSerializer):
    image_count = serializers.IntegerField(read_only=True)
    effective_cover = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True
    )

    class Meta:
        model = GalleryAlbum
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "cover_image",
            "effective_cover",
            "is_published",
            "is_featured",
            "taken_at",
            "image_count",
            "created_by_name",
            "created_at",
        ]

    def get_effective_cover(self, obj):
        request = self.context.get("request")
        cover = obj.effective_cover
        if cover and request:
            try:
                return request.build_absolute_uri(cover.url)
            except Exception:
                pass
        return None


# ---------------------------------------------------------------------------
# GalleryAlbum — Detail (includes images)
# ---------------------------------------------------------------------------


class GalleryAlbumDetailSerializer(GalleryAlbumListSerializer):
    images = GalleryImageSerializer(many=True, read_only=True)
    event_title = serializers.CharField(source="event.title", read_only=True)
    program_title = serializers.CharField(source="program.title", read_only=True)

    class Meta(GalleryAlbumListSerializer.Meta):
        fields = GalleryAlbumListSerializer.Meta.fields + [
            "images",
            "event",
            "event_title",
            "program",
            "program_title",
            "updated_at",
        ]


# ---------------------------------------------------------------------------
# GalleryAlbum — Write
# ---------------------------------------------------------------------------


class GalleryAlbumWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryAlbum
        fields = [
            "title",
            "description",
            "cover_image",
            "event",
            "program",
            "is_published",
            "is_featured",
            "taken_at",
        ]