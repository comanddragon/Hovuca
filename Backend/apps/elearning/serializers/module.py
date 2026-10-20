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
            "age_min",
            "age_max",
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
            "age_min",
            "age_max",
            "chapter_count",
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

    def get_chapter_count(self, obj):
        return obj.chapters.count()

    def get_has_quiz(self, obj):
        return hasattr(obj, "quiz") and obj.quiz is not None


class ModuleWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ["course", "title", "description", "order", "age_min", "age_max"]

    def validate_order(self, value):
        if value < 0:
            raise serializers.ValidationError("Order must be a non-negative integer.")
        return value

    def validate(self, attrs):
        age_min = attrs.get("age_min", getattr(self.instance, "age_min", None))
        age_max = attrs.get("age_max", getattr(self.instance, "age_max", None))
        if age_max is not None and age_min is not None and age_max < age_min:
            raise serializers.ValidationError({"age_max": "Age maximum must be greater than or equal to age minimum."})
        return attrs
