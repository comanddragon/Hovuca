from rest_framework import serializers

from apps.accounts.api.serializers import UserPublicSerializer
from apps.programs.models import Program, Project


# ---------------------------------------------------------------------------
# Project
# ---------------------------------------------------------------------------


class ProjectListSerializer(serializers.ModelSerializer):
    lead = UserPublicSerializer(read_only=True)
    program = serializers.SlugRelatedField(read_only=True, slug_field="slug")  # ← add this

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "slug",
            "program",
            "excerpt",
            "cover_image",
            "cover_image_alt",
            "progress_percentage",
            "raised_amount",
            "budget",
            "lead",
            "status",
            "start_date",
            "end_date",
            "created_at",
        ]
        read_only_fields = fields


class ProjectDetailSerializer(serializers.ModelSerializer):
    lead = UserPublicSerializer(read_only=True)
    lead_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "program",
            "title",
            "slug",
            "excerpt",
            "description",
            "cover_image",
            "cover_image_alt",
            "lead",
            "lead_id",
            "status",
            "progress_percentage",
            "raised_amount",
            "budget",
            "start_date",
            "end_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        lead_id = validated_data.pop("lead_id", None)
        project = Project.objects.create(**validated_data)
        if lead_id:
            project.lead_id = lead_id
            project.save(update_fields=["lead_id"])
        return project

    def update(self, instance, validated_data):
        lead_id = validated_data.pop("lead_id", None)
        if lead_id is not None:
            instance.lead_id = lead_id
        return super().update(instance, validated_data)


# ---------------------------------------------------------------------------
# Program
# ---------------------------------------------------------------------------


class ProgramListSerializer(serializers.ModelSerializer):
    project_count = serializers.SerializerMethodField()

    class Meta:
        model = Program
        fields = [
            "id",
            "title",
            "slug",
            "status",
            "excerpt",
            "start_date",
            "end_date",
            "banner",
            "target_beneficiaries",
            "project_count",
            "created_at",
        ]
        read_only_fields = fields

    def get_project_count(self, obj):
        return obj.projects.count()

class ProgramDetailSerializer(serializers.ModelSerializer):
    projects = ProjectListSerializer(many=True, read_only=True)

    class Meta:
        model = Program
        fields = [
            "id",
            "organization",
            "title",
            "slug",
            "excerpt",
            "description",
            "banner",
            "status",
            "start_date",
            "end_date",
            "target_beneficiaries",
            "projects",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]