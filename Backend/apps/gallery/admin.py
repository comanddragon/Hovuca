from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from apps.gallery.models import GalleryAlbum, GalleryImage

# ---------------------------------------------------------------------------
# Inline
# ---------------------------------------------------------------------------


class GalleryImageInline(TabularInline):
    model = GalleryImage
    extra = 1
    fields = ("image", "title", "alt_text", "order", "is_featured", "media_type")
    ordering = ("order",)
    readonly_fields = ("view_count",)


# ---------------------------------------------------------------------------
# GalleryAlbum
# ---------------------------------------------------------------------------


@admin.register(GalleryAlbum)
class GalleryAlbumAdmin(ModelAdmin):
    list_display = (
        "title", "is_published", "is_featured", "taken_at",
        "image_count", "event", "program", "created_by",
    )
    list_filter = ("is_published", "is_featured", "program")
    search_fields = ("title", "slug", "description")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("image_count", "effective_cover", "created_at", "updated_at")
    date_hierarchy = "taken_at"
    ordering = ("-taken_at", "-created_at")
    autocomplete_fields = ("created_by", "event", "program")
    inlines = [GalleryImageInline]

    fieldsets = (
        ("Content", {
            "fields": ("title", "slug", "description", "cover_image", "effective_cover"),
        }),
        ("Linkage", {
            "fields": ("event", "program", "project"),
        }),
        ("Publishing", {
            "fields": ("is_published", "is_featured", "taken_at"),
        }),
        ("Stats & Timestamps", {
            "classes": ("collapse",),
            "fields": ("image_count", "created_by", "created_at", "updated_at"),
        }),
    )

    actions = ["publish_albums", "unpublish_albums", "feature_albums", "unfeature_albums"]

    @admin.action(description="Publish selected albums")
    def publish_albums(self, request, queryset):
        updated = queryset.update(is_published=True)
        self.message_user(request, f"{updated} album(s) published.")

    @admin.action(description="Unpublish selected albums")
    def unpublish_albums(self, request, queryset):
        updated = queryset.update(is_published=False)
        self.message_user(request, f"{updated} album(s) unpublished.")

    @admin.action(description="Mark selected albums as featured")
    def feature_albums(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f"{updated} album(s) marked as featured.")

    @admin.action(description="Remove featured flag from selected albums")
    def unfeature_albums(self, request, queryset):
        updated = queryset.update(is_featured=False)
        self.message_user(request, f"{updated} album(s) unfeatured.")


# ---------------------------------------------------------------------------
# GalleryImage
# ---------------------------------------------------------------------------


@admin.register(GalleryImage)
class GalleryImageAdmin(ModelAdmin):
    list_display = (
        "title_or_id", "album", "media_type", "order",
        "is_featured", "view_count", "uploaded_by",
    )
    list_filter = ("media_type", "is_featured", "album")
    search_fields = ("title", "caption", "alt_text", "album__title")
    readonly_fields = ("view_count", "thumbnail", "created_at", "updated_at")
    ordering = ("album", "order", "created_at")
    autocomplete_fields = ("album", "uploaded_by")

    fieldsets = (
        ("Media", {
            "fields": ("album", "image", "thumbnail", "media_type"),
        }),
        ("Metadata", {
            "fields": ("title", "caption", "alt_text", "tags"),
        }),
        ("Display", {
            "fields": ("order", "is_featured"),
        }),
        ("Stats & Timestamps", {
            "classes": ("collapse",),
            "fields": ("view_count", "uploaded_by", "created_at", "updated_at"),
        }),
    )

    actions = ["feature_images", "unfeature_images"]

    def title_or_id(self, obj):
        return obj.title or f"Image #{obj.pk}"
    title_or_id.short_description = "Title"

    @admin.action(description="Mark selected images as featured")
    def feature_images(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f"{updated} image(s) marked as featured.")

    @admin.action(description="Remove featured flag from selected images")
    def unfeature_images(self, request, queryset):
        updated = queryset.update(is_featured=False)
        self.message_user(request, f"{updated} image(s) unfeatured.")
