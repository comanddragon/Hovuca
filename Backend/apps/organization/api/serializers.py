from rest_framework import serializers

from apps.accounts.api.serializers import UserPublicSerializer
from apps.organization.models import Organization, Branch, Department


# ---------------------------------------------------------------------------
# Department
# ---------------------------------------------------------------------------


class DepartmentSerializer(serializers.ModelSerializer):
    head = UserPublicSerializer(read_only=True)
    head_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Department
        fields = [
            "id",
            "branch",
            "name",
            "description",
            "head",
            "head_id",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        head_id = validated_data.pop("head_id", None)
        department = Department.objects.create(**validated_data)
        if head_id:
            department.head_id = head_id
            department.save(update_fields=["head_id"])
        return department

    def update(self, instance, validated_data):
        head_id = validated_data.pop("head_id", None)
        if head_id is not None:
            instance.head_id = head_id
        return super().update(instance, validated_data)


# ---------------------------------------------------------------------------
# Branch
# ---------------------------------------------------------------------------


class BranchListSerializer(serializers.ModelSerializer):
    manager = UserPublicSerializer(read_only=True)

    class Meta:
        model = Branch
        fields = [
            "id",
            "name",
            "slug",
            "location",
            "manager",
            "is_active",
            "created_at",
        ]
        read_only_fields = fields


class BranchDetailSerializer(serializers.ModelSerializer):
    manager = UserPublicSerializer(read_only=True)
    manager_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    departments = DepartmentSerializer(many=True, read_only=True)

    class Meta:
        model = Branch
        fields = [
            "id",
            "organization",
            "name",
            "slug",
            "location",
            "manager",
            "manager_id",
            "departments",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        manager_id = validated_data.pop("manager_id", None)
        branch = Branch.objects.create(**validated_data)
        if manager_id:
            branch.manager_id = manager_id
            branch.save(update_fields=["manager_id"])
        return branch

    def update(self, instance, validated_data):
        manager_id = validated_data.pop("manager_id", None)
        if manager_id is not None:
            instance.manager_id = manager_id
        return super().update(instance, validated_data)


# ---------------------------------------------------------------------------
# Organization
# ---------------------------------------------------------------------------


class OrganizationListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "slug",
            "logo",
            "website",
            "is_active",
            "created_at",
        ]
        read_only_fields = fields


class OrganizationDetailSerializer(serializers.ModelSerializer):
    branches = BranchListSerializer(many=True, read_only=True)

    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "logo",
            "website",
            "email",
            "phone",
            "address",
            "founded_year",
            "is_active",
            "branches",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
