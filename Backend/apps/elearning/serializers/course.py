from rest_framework import serializers

from apps.accounts.api.serializers import UserPublicSerializer
from apps.elearning.models.course import Subject, Course


# ---------------------------------------------------------------------------
# Subject
# ---------------------------------------------------------------------------


class SubjectSerializer(serializers.ModelSerializer):
    course_count = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon",
            "is_active",
            "course_count",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_course_count(self, obj):
        return obj.courses.filter(is_published=True).count()


# ---------------------------------------------------------------------------
# Course — list (lightweight)
# ---------------------------------------------------------------------------


class CourseListSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    instructor = UserPublicSerializer(read_only=True)
    enrollment_count = serializers.ReadOnlyField(source="total_enrollments")

    class Meta:
        model = Course
        fields = [
            "id",
            "subject",
            "instructor",
            "title",
            "slug",
            "description",
            "thumbnail",
            "difficulty",
            "estimated_hours",
            "is_published",
            "is_free",
            "enrollment_count",
            "created_at",
        ]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Course — detail (with nested modules preview)
# ---------------------------------------------------------------------------


class CourseDetailSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    subject_id = serializers.UUIDField(write_only=True, required=True)
    instructor = UserPublicSerializer(read_only=True)
    instructor_id = serializers.UUIDField(
        write_only=True, required=False, allow_null=True
    )
    enrollment_count = serializers.ReadOnlyField(source="total_enrollments")
    # Modules injected by ModuleSerializer (avoid circular import — set via context or view)
    modules = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "subject",
            "subject_id",
            "instructor",
            "instructor_id",
            "title",
            "slug",
            "description",
            "thumbnail",
            "difficulty",
            "estimated_hours",
            "is_published",
            "is_free",
            "enrollment_count",
            "modules",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "enrollment_count", "created_at", "updated_at"]

    def get_modules(self, obj):
        from apps.elearning.serializers.module import ModuleDetailSerializer

        return ModuleDetailSerializer(
            obj.modules.all(), many=True, context=self.context
        ).data

    def create(self, validated_data):
        subject_id = validated_data.pop("subject_id")
        instructor_id = validated_data.pop("instructor_id", None)
        course = Course.objects.create(
            subject_id=subject_id,
            instructor_id=instructor_id,
            **validated_data,
        )
        return course

    def update(self, instance, validated_data):
        subject_id = validated_data.pop("subject_id", None)
        instructor_id = validated_data.pop("instructor_id", None)
        if subject_id:
            instance.subject_id = subject_id
        if instructor_id is not None:
            instance.instructor_id = instructor_id
        return super().update(instance, validated_data)
