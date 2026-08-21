from rest_framework import serializers
from apps.donors.models import DonorOrganization, DonorContact, Grant, DonorEngagement
from apps.accounts.api.serializers import UserPublicSerializer


# ---------------------------------------------------------------------------
# DonorContact
# ---------------------------------------------------------------------------


class DonorContactSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = DonorContact
        fields = [
            "id", "organization", "first_name", "last_name", "full_name",
            "role", "email", "phone", "is_primary", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "full_name", "created_at", "updated_at"]

    def get_full_name(self, obj):
        return obj.get_full_name()


class DonorContactWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonorContact
        fields = [
            "organization", "first_name", "last_name",
            "role", "email", "phone", "is_primary", "notes",
        ]


# ---------------------------------------------------------------------------
# Grant
# ---------------------------------------------------------------------------


class GrantListSerializer(serializers.ModelSerializer):
    donor_organization_name = serializers.CharField(
        source="donor_organization.name", read_only=True
    )
    program_title = serializers.CharField(source="program.title", read_only=True, default=None)
    project_title = serializers.CharField(source="project.title", read_only=True, default=None)

    class Meta:
        model = Grant
        fields = [
            "id", "reference_code", "title", "donor_organization", "donor_organization_name",
            "program", "program_title", "project", "project_title",
            "funding_type", "amount", "currency", "status",
            "agreement_date", "disbursed_date", "reporting_deadline",
            "report_submitted", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class GrantDetailSerializer(serializers.ModelSerializer):
    donor_organization_name = serializers.CharField(
        source="donor_organization.name", read_only=True
    )
    internal_owner = UserPublicSerializer(read_only=True)
    contact = DonorContactSerializer(read_only=True)

    class Meta:
        model = Grant
        fields = [
            "id", "reference_code", "title",
            "donor_organization", "donor_organization_name",
            "program", "project", "campaign",
            "funding_type", "amount", "currency", "status",
            "agreement_date", "disbursed_date", "reporting_deadline",
            "agreement_document",
            "report_submitted", "report_submitted_at",
            "contact", "internal_owner",
            "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "report_submitted_at", "created_at", "updated_at"]


class GrantWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grant
        fields = [
            "donor_organization", "program", "project", "campaign",
            "reference_code", "title", "funding_type",
            "amount", "currency", "status",
            "agreement_date", "disbursed_date", "reporting_deadline",
            "agreement_document",
            "report_submitted",
            "contact", "internal_owner", "notes",
        ]

    def validate(self, attrs):
        start = attrs.get("agreement_date")
        end = attrs.get("reporting_deadline")
        if start and end and end < start:
            raise serializers.ValidationError(
                {"reporting_deadline": "Reporting deadline cannot be before agreement date."}
            )
        return attrs


# ---------------------------------------------------------------------------
# DonorOrganization
# ---------------------------------------------------------------------------


class DonorOrganizationListSerializer(serializers.ModelSerializer):
    grant_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = DonorOrganization
        fields = [
            "id", "name", "slug", "abbreviation", "type", "logo",
            "country", "tier", "status", "total_funded", "currency", "website",
            "first_funded_at", "last_funded_at", "grant_count", "created_at",
        ]
        read_only_fields = fields


class DonorOrganizationDetailSerializer(serializers.ModelSerializer):
    relationship_owner = UserPublicSerializer(read_only=True)
    contacts = DonorContactSerializer(many=True, read_only=True)
    recent_grants = serializers.SerializerMethodField()
    grant_count = serializers.SerializerMethodField()

    class Meta:
        model = DonorOrganization
        fields = [
            "id", "name", "slug", "abbreviation", "type", "logo", "description",
            "website", "email", "phone",
            "country", "city", "address",
            "tier", "status", "focus_areas",
            "relationship_owner",
            "first_funded_at", "last_funded_at", "total_funded", "currency",
            "prefers_anonymous", "notes",
            "contacts", "recent_grants", "grant_count",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "slug", "total_funded",
            "first_funded_at", "last_funded_at",
            "created_at", "updated_at",
        ]

    def get_recent_grants(self, obj):
        qs = obj.grants.filter(deleted_at__isnull=True).order_by("-disbursed_date")[:5]
        return GrantListSerializer(qs, many=True).data

    def get_grant_count(self, obj):
        return obj.grants.filter(deleted_at__isnull=True).count()


class DonorOrganizationWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonorOrganization
        fields = [
            "name", "abbreviation", "type", "logo", "description",
            "website", "email", "phone",
            "country", "city", "address",
            "tier", "status", "focus_areas",
            "relationship_owner", "currency",
            "prefers_anonymous", "notes",
        ]


# ---------------------------------------------------------------------------
# DonorEngagement
# ---------------------------------------------------------------------------


class DonorEngagementSerializer(serializers.ModelSerializer):
    logged_by = UserPublicSerializer(read_only=True)
    contact_name = serializers.CharField(source="contact.get_full_name", read_only=True, default=None)
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    grant_title = serializers.CharField(source="grant.title", read_only=True, default=None)

    class Meta:
        model = DonorEngagement
        fields = [
            "id", "organization", "organization_name",
            "contact", "contact_name",
            "logged_by",
            "grant", "grant_title",
            "type", "date", "summary", "outcome",
            "next_action", "next_action_date",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "logged_by", "created_at", "updated_at"]


class DonorEngagementWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonorEngagement
        fields = [
            "organization", "contact", "grant",
            "type", "date", "summary", "outcome",
            "next_action", "next_action_date",
        ]


# ---------------------------------------------------------------------------
# Stats / Summary
# ---------------------------------------------------------------------------


class DonorSummarySerializer(serializers.Serializer):
    total_organizations = serializers.IntegerField()
    active_organizations = serializers.IntegerField()
    total_grants = serializers.IntegerField()
    total_funded_usd = serializers.DecimalField(max_digits=16, decimal_places=2)
    platinum_count = serializers.IntegerField()
    gold_count = serializers.IntegerField()
    silver_count = serializers.IntegerField()
    bronze_count = serializers.IntegerField()