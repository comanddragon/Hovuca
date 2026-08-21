from rest_framework import serializers

from apps.accounts.api.serializers import UserPublicSerializer
from apps.elearning.models.enrollment import Enrollment, ChapterProgress
from apps.elearning.serializers.course import CourseListSerializer


# ---------------------------------------------------------------------------
# Chapter Progress
# ---------------------------------------------------------------------------


class ChapterProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChapterProgress
        fields = [
            "id",
            "enrollment",
            "chapter",
            "completed_at",
        ]
        read_only_fields = ["id", "completed_at"]


class MarkChapterCompleteSerializer(serializers.Serializer):
    """Payload for marking a single chapter as complete."""

    chapter_id = serializers.UUIDField()


# ---------------------------------------------------------------------------
# Enrollment
# ---------------------------------------------------------------------------


class EnrollmentListSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    progress_percentage = serializers.ReadOnlyField()
    is_completed = serializers.ReadOnlyField()

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "course",
            "enrolled_at",
            "completed_at",
            "is_completed",
            "progress_percentage",
            "certificate_issued",
        ]
        read_only_fields = fields


class EnrollmentDetailSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    course = CourseListSerializer(read_only=True)
    progress_percentage = serializers.ReadOnlyField()
    is_completed = serializers.ReadOnlyField()
    chapter_progresses = ChapterProgressSerializer(many=True, read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "user",
            "course",
            "enrolled_at",
            "completed_at",
            "is_completed",
            "progress_percentage",
            "certificate_issued",
            "certificate_url",
            "chapter_progresses",
        ]
        read_only_fields = fields


class EnrollSerializer(serializers.Serializer):
    """Simple payload to enroll the current user in a course."""

    course_id = serializers.UUIDField()

    def validate_course_id(self, value):
        from apps.elearning.models.course import Course

        try:
            course = Course.objects.get(pk=value, is_published=True)
        except Course.DoesNotExist:
            raise serializers.ValidationError("Course not found or not yet published.")
        user = self.context["request"].user
        if Enrollment.objects.filter(user=user, course=course).exists():
            raise serializers.ValidationError(
                "You are already enrolled in this course."
            )
        self.context["course"] = course
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        course = self.context["course"]
        return Enrollment.objects.create(user=user, course=course)
