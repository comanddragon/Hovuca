from rest_framework import serializers

from apps.elearning.models.chapter import Chapter


class ChapterListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = [
            "id",
            "module",
            "title",
            "order",
            "content_type",
            "duration_minutes",
            "is_preview",
        ]
        read_only_fields = fields


class ChapterDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = [
            "id",
            "module",
            "title",
            "order",
            "content_type",
            "content_url",
            "content_body",
            "content_file",
            "duration_minutes",
            "is_preview",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        content_type = attrs.get(
            "content_type", getattr(self.instance, "content_type", None)
        )
        content_url = attrs.get("content_url", "")
        content_body = attrs.get("content_body", "")
        content_file = attrs.get("content_file", None)

        if content_type == Chapter.ContentType.VIDEO and not content_url:
            raise serializers.ValidationError(
                {"content_url": "A URL is required for video chapters."}
            )
        if content_type == Chapter.ContentType.TEXT and not content_body:
            raise serializers.ValidationError(
                {"content_body": "Content body is required for text chapters."}
            )
        if content_type == Chapter.ContentType.PDF and not content_file:
            if not (self.instance and self.instance.content_file):
                raise serializers.ValidationError(
                    {"content_file": "A file is required for PDF chapters."}
                )
        return attrs


class ChapterWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = [
            "module",
            "title",
            "order",
            "content_type",
            "content_url",
            "content_body",
            "content_file",
            "duration_minutes",
            "is_preview",
        ]

    def validate(self, attrs):
        return ChapterDetailSerializer.validate(self, attrs)
