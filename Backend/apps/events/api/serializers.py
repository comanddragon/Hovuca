from django.utils import timezone
from rest_framework import serializers

from apps.events.models import Event, EventCategory, EventImage, EventRegistration


# ---------------------------------------------------------------------------
# EventCategory
# ---------------------------------------------------------------------------


class EventCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EventCategory
        fields = ["id", "name", "slug", "description", "color", "is_active"]
        read_only_fields = ["id"]


# ---------------------------------------------------------------------------
# EventImage
# ---------------------------------------------------------------------------


class EventImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventImage
        fields = ["id", "image", "alt_text", "order"]
        read_only_fields = ["id"]


class EventImageWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventImage
        fields = ["image", "alt_text", "order"]


# ---------------------------------------------------------------------------
# EventRegistration (nested inside event detail)
# ---------------------------------------------------------------------------


class EventRegistrationSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(
        source="user.get_full_name", read_only=True
    )
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = EventRegistration
        fields = [
            "id",
            "user",
            "user_full_name",
            "user_email",
            "status",
            "notes",
            "checked_in_at",
            "created_at",
        ]
        read_only_fields = ["id", "user", "user_full_name", "user_email", "created_at"]


class EventRegistrationWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventRegistration
        fields = ["notes"]


# ---------------------------------------------------------------------------
# Event — List (lightweight for cards)
# ---------------------------------------------------------------------------


class EventListSerializer(serializers.ModelSerializer):
    category = EventCategorySerializer(read_only=True)
    organizer_name = serializers.CharField(
        source="organizer.get_full_name", read_only=True
    )
    attendee_count = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    is_registered = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "cover_image",
            "cover_image_alt",
            "category",
            "organizer_name",
            "event_type",
            "location_name",
            "start_date",
            "end_date",
            "status",
            "is_featured",
            "is_registration_required",
            "max_attendees",
            "attendee_count",
            "is_full",
            "is_registered",
            "view_count",
        ]

    def get_is_registered(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.registrations.filter(
            user=request.user,
            status__in=[
                EventRegistration.Status.CONFIRMED,
                EventRegistration.Status.PENDING,
            ],
            deleted_at__isnull=True,
        ).exists()


# ---------------------------------------------------------------------------
# Event — Detail (full data, includes images array)
# ---------------------------------------------------------------------------


class EventDetailSerializer(EventListSerializer):
    my_registration = serializers.SerializerMethodField()
    images = EventImageSerializer(many=True, read_only=True)

    class Meta(EventListSerializer.Meta):
        fields = EventListSerializer.Meta.fields + [
            "description",
            "location_address",
            "online_url",
            "registration_deadline",
            "meta_title",
            "meta_description",
            "my_registration",
            "images",
            "created_at",
            "updated_at",
        ]

    def get_my_registration(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        try:
            reg = obj.registrations.get(
                user=request.user, deleted_at__isnull=True
            )
            return EventRegistrationSerializer(reg).data
        except EventRegistration.DoesNotExist:
            return None


# ---------------------------------------------------------------------------
# Event — Write (create / update)
# ---------------------------------------------------------------------------


class EventWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            "title",
            "excerpt",
            "description",
            "cover_image",
            "cover_image_alt",
            "category",
            "program",
            "event_type",
            "location_name",
            "location_address",
            "online_url",
            "start_date",
            "end_date",
            "is_registration_required",
            "registration_deadline",
            "max_attendees",
            "status",
            "is_featured",
            "meta_title",
            "meta_description",
        ]

    def validate(self, data):
        start = data.get("start_date")
        end = data.get("end_date")
        if start and end and end <= start:
            raise serializers.ValidationError(
                {"end_date": "End date must be after start date."}
            )
        return data