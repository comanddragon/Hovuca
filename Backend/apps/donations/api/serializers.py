from rest_framework import serializers

from apps.accounts.api.serializers import UserPublicSerializer
from apps.donations.models import Donation, DonationCampaign, DonationPaymentSettings


class DonationPaymentSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationPaymentSettings
        fields = [
            "bank_name", "account_name", "account_number", "iban", "swift_code",
            "bank_currency", "bank_instructions", "paypal_url", "campay_url",
        ]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Campaign
# ---------------------------------------------------------------------------


class DonationCampaignListSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.ReadOnlyField()

    class Meta:
        model = DonationCampaign
        fields = [
            "id",
            "title",
            "slug",
            "goal_amount",
            "raised_amount",
            "progress_percentage",
            "status",
            "start_date",
            "end_date",
            "banner",
            "created_at",
        ]
        read_only_fields = fields


class DonationCampaignDetailSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.ReadOnlyField()
    total_donors = serializers.SerializerMethodField()

    class Meta:
        model = DonationCampaign
        fields = [
            "id",
            "program",
            "title",
            "slug",
            "description",
            "goal_amount",
            "raised_amount",
            "progress_percentage",
            "status",
            "start_date",
            "end_date",
            "banner",
            "total_donors",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "raised_amount", "created_at", "updated_at"]

    def get_total_donors(self, obj):
        return (
            obj.donations.filter(status=Donation.Status.COMPLETED)
            .values("donor")
            .distinct()
            .count()
        )


class DonationCampaignWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationCampaign
        fields = [
            "program",
            "title",
            "slug",
            "description",
            "goal_amount",
            "status",
            "start_date",
            "end_date",
            "banner",
        ]

    def validate_goal_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Goal amount must be greater than zero.")
        return value


# ---------------------------------------------------------------------------
# Donation
# ---------------------------------------------------------------------------


class DonationListSerializer(serializers.ModelSerializer):
    donor = serializers.SerializerMethodField()

    class Meta:
        model = Donation
        fields = [
            "id",
            "donor",
            "campaign",
            "amount",
            "currency",
            "gateway",
            "status",
            "is_anonymous",
            "created_at",
        ]
        read_only_fields = fields

    def get_donor(self, obj):
        if obj.is_anonymous:
            return None
        return UserPublicSerializer(obj.donor).data if obj.donor else None


class DonationDetailSerializer(serializers.ModelSerializer):
    donor = serializers.SerializerMethodField()
    campaign = DonationCampaignListSerializer(read_only=True)

    class Meta:
        model = Donation
        fields = [
            "id",
            "donor",
            "campaign",
            "amount",
            "currency",
            "gateway",
            "gateway_transaction_id",
            "status",
            "is_anonymous",
            "message",
            "receipt_sent",
            "receipt_sent_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_donor(self, obj):
        if obj.is_anonymous:
            return None
        return UserPublicSerializer(obj.donor).data if obj.donor else None


class DonationCreateSerializer(serializers.ModelSerializer):
    """Used by the donor to initiate a donation."""

    class Meta:
        model = Donation
        fields = [
            "campaign",
            "amount",
            "currency",
            "gateway",
            "is_anonymous",
            "message",
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Donation amount must be greater than zero."
            )
        return value

    def create(self, validated_data):
        # Attach the authenticated user as donor
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["donor"] = request.user
        return super().create(validated_data)
