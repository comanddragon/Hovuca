from rest_framework import serializers

from apps.accounts.api.serializers import UserPublicSerializer
from apps.volunteers.models import VolunteerProfile, VolunteerTask, VolunteerApplication


# ---------------------------------------------------------------------------
# Volunteer Task
# ---------------------------------------------------------------------------


class VolunteerTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerTask
        fields = [
            "id",
            "volunteer",
            "project",
            "title",
            "description",
            "status",
            "due_date",
            "hours_logged",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class VolunteerTaskListSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerTask
        fields = [
            "id",
            "title",
            "status",
            "due_date",
            "hours_logged",
            "project",
        ]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Volunteer Profile
# ---------------------------------------------------------------------------


class VolunteerProfileListSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = VolunteerProfile
        fields = [
            "id",
            "user",
            "availability",
            "hours_contributed",
            "skills",
            "department",
        ]
        read_only_fields = fields


class VolunteerProfileDetailSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    tasks = VolunteerTaskListSerializer(many=True, read_only=True)

    class Meta:
        model = VolunteerProfile
        fields = [
            "id",
            "user",
            "bio",
            "skills",
            "availability",
            "hours_contributed",
            "department",
            "tasks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "hours_contributed",
            "created_at",
            "updated_at",
        ]


class VolunteerApplicationSerializer(serializers.ModelSerializer):
    phone = serializers.RegexField(r"^(?=(?:\D*[0-9]){6})[+0-9\s().-]{6,40}$", max_length=40)
    skills = serializers.CharField(max_length=5000)
    motivation = serializers.CharField(max_length=5000)
    hours_per_week = serializers.IntegerField(min_value=1, max_value=168)
    contact_consent = serializers.BooleanField(required=True)

    class Meta:
        model = VolunteerApplication
        fields = [
            "full_name", "email", "phone", "location", "occupation", "skills",
            "interests", "availability", "hours_per_week", "motivation", "contact_consent",
        ]

    def validate_contact_consent(self, value):
        if not value:
            raise serializers.ValidationError("Please allow the team to contact you about your application.")
        return value


class VolunteerProfileWriteSerializer(serializers.ModelSerializer):
    """Used for create / update operations (excludes nested read-only fields)."""

    class Meta:
        model = VolunteerProfile
        fields = [
            "bio",
            "skills",
            "availability",
            "department",
        ]

    def validate_skills(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Skills must be a list of strings.")
        if not all(isinstance(s, str) for s in value):
            raise serializers.ValidationError("Each skill must be a string.")
        return value
