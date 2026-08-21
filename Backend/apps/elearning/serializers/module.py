from rest_framework import serializers

from apps.elearning.models.module import Module


class ModuleListSerializer(serializers.ModelSerializer):
    chapter_count = serializers.SerializerMethodField()
    has_quiz = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = [
            "id",
            "course",
            "title",
            "description",
            "order",
            "chapter_count",
            "has_quiz",
            "created_at",
        ]
        read_only_fields = fields

    def get_chapter_count(self, obj):
        return obj.chapters.count()

    def get_has_quiz(self, obj):
        return hasattr(obj, "quiz") and obj.quiz is not None


class ModuleDetailSerializer(serializers.ModelSerializer):
    chapters = serializers.SerializerMethodField()
    has_quiz = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = [
            "id",
            "course",
            "title",
            "description",
            "order",
            "chapters",
            "has_quiz",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_chapters(self, obj):
        from apps.elearning.serializers.chapter import ChapterListSerializer

        return ChapterListSerializer(
            obj.chapters.all(), many=True, context=self.context
        ).data

    def get_has_quiz(self, obj):
        return hasattr(obj, "quiz") and obj.quiz is not None


class ModuleWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ["course", "title", "description", "order"]

    def validate_order(self, value):
        if value < 0:
            raise serializers.ValidationError("Order must be a non-negative integer.")
        return value
