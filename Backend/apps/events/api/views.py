from django.db.models import F
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.core.pagination import StandardPagination
from apps.core.permissions import IsAdmin, IsStaffOrAdmin, IsOwnerOrAdmin

from apps.events.models import Event, EventCategory, EventImage, EventRegistration
from .serializers import (
    EventCategorySerializer,
    EventDetailSerializer,
    EventImageSerializer,
    EventImageWriteSerializer,
    EventListSerializer,
    EventWriteSerializer,
    EventRegistrationSerializer,
    EventRegistrationWriteSerializer,
)


# ---------------------------------------------------------------------------
# EventCategory
# ---------------------------------------------------------------------------


class EventCategoryViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/events/categories/        [public]
    POST   /api/v1/events/categories/        [admin]
    GET    /api/v1/events/categories/{id}/   [public]
    PATCH  /api/v1/events/categories/{id}/   [admin]
    DELETE /api/v1/events/categories/{id}/   [admin]
    """

    queryset = EventCategory.objects.filter(deleted_at__isnull=True).order_by("name")
    serializer_class = EventCategorySerializer
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        return qs

    def perform_destroy(self, instance):
        instance.soft_delete()


# ---------------------------------------------------------------------------
# Event
# ---------------------------------------------------------------------------


class EventViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/events/                        [public — published only]
    POST   /api/v1/events/                        [staff/admin]
    GET    /api/v1/events/{slug}/                 [public]
    PATCH  /api/v1/events/{slug}/                 [staff/admin]
    DELETE /api/v1/events/{slug}/                 [admin]

    Actions:
    POST   /api/v1/events/{slug}/register/        [authenticated]
    POST   /api/v1/events/{slug}/unregister/      [authenticated]
    POST   /api/v1/events/{slug}/publish/         [staff/admin]
    POST   /api/v1/events/{slug}/cancel/          [staff/admin]
    GET    /api/v1/events/{slug}/registrations/   [staff/admin]
    GET    /api/v1/events/featured/               [public]
    GET    /api/v1/events/upcoming/               [public]

    Image management:
    GET    /api/v1/events/{slug}/images/          [public]
    POST   /api/v1/events/{slug}/images/          [staff/admin]
    DELETE /api/v1/events/{slug}/images/{id}/     [staff/admin]
    PATCH  /api/v1/events/{slug}/images/{id}/     [staff/admin]

    Filters: ?category=<slug>  ?event_type=<str>  ?status=<str>
             ?search=<str>  ?is_featured=true  ?program=<slug>
    """

    lookup_field = "slug"
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ("list", "retrieve", "featured", "upcoming", "images"):
            return [AllowAny()]
        if self.action in ("publish", "cancel", "update", "partial_update",
                           "add_image", "delete_image", "update_image"):
            return [IsStaffOrAdmin()]
        if self.action == "destroy":
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return EventWriteSerializer
        if self.action == "retrieve":
            return EventDetailSerializer
        return EventListSerializer

    def get_queryset(self):
        qs = (
            Event.objects.filter(deleted_at__isnull=True)
            .select_related("organizer", "category", "program")
            .prefetch_related("registrations", "images")
        )

        user = self.request.user

        # Public sees only published events
        if not (user.is_authenticated and user.role in ("admin", "staff")):
            qs = qs.filter(status=Event.Status.PUBLISHED)

        # Query filters
        category = self.request.query_params.get("category")
        event_type = self.request.query_params.get("event_type")
        event_status = self.request.query_params.get("status")
        search = self.request.query_params.get("search")
        is_featured = self.request.query_params.get("is_featured")
        program = self.request.query_params.get("program")

        if category:
            qs = qs.filter(category__slug=category)
        if event_type:
            qs = qs.filter(event_type=event_type)
        if event_status and user.is_authenticated and user.role in ("admin", "staff"):
            qs = qs.filter(status=event_status)
        if search:
            qs = qs.filter(title__icontains=search) | qs.filter(
                excerpt__icontains=search
            )
        if is_featured is not None:
            qs = qs.filter(is_featured=is_featured.lower() == "true")
        if program:
            qs = qs.filter(program__slug=program)

        return qs.distinct().order_by("start_date")

    def retrieve(self, request, *args, **kwargs):
        """Increment view_count on every public read."""
        instance = self.get_object()
        if instance.is_published:
            Event.objects.filter(pk=instance.pk).update(
                view_count=F("view_count") + 1
            )
            instance.refresh_from_db(fields=["view_count"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()

    # ------------------------------------------------------------------
    # Publish / Cancel
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], permission_classes=[IsStaffOrAdmin])
    def publish(self, request, slug=None):
        event = self.get_object()
        event.status = Event.Status.PUBLISHED
        event.save(update_fields=["status"])
        return Response({"detail": f"'{event.title}' is now published."})

    @action(detail=True, methods=["post"], permission_classes=[IsStaffOrAdmin])
    def cancel(self, request, slug=None):
        event = self.get_object()
        event.status = Event.Status.CANCELLED
        event.save(update_fields=["status"])
        return Response({"detail": f"'{event.title}' has been cancelled."})

    # ------------------------------------------------------------------
    # Register / Unregister
    # ------------------------------------------------------------------

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def register(self, request, slug=None):
        """POST /api/v1/events/{slug}/register/"""
        event = self.get_object()

        if not event.is_published:
            return Response(
                {"detail": "This event is not available for registration."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if event.is_full:
            reg, created = EventRegistration.objects.get_or_create(
                event=event,
                user=request.user,
                defaults={"status": EventRegistration.Status.WAITLISTED},
            )
            if not created:
                return Response(
                    {"detail": "You are already registered for this event."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {"detail": "Event is full. You have been added to the waitlist.", "status": "waitlisted"},
                status=status.HTTP_201_CREATED,
            )

        serializer = EventRegistrationWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reg, created = EventRegistration.objects.get_or_create(
            event=event,
            user=request.user,
            defaults={
                "status": EventRegistration.Status.CONFIRMED,
                "notes": serializer.validated_data.get("notes", ""),
            },
        )

        if not created:
            return Response(
                {"detail": "You are already registered for this event."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            EventRegistrationSerializer(reg).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def unregister(self, request, slug=None):
        """POST /api/v1/events/{slug}/unregister/"""
        event = self.get_object()
        try:
            reg = EventRegistration.objects.get(
                event=event, user=request.user, deleted_at__isnull=True
            )
            reg.soft_delete()
            return Response({"detail": "Successfully unregistered from event."})
        except EventRegistration.DoesNotExist:
            return Response(
                {"detail": "You are not registered for this event."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # ------------------------------------------------------------------
    # Registrations list (admin/staff)
    # ------------------------------------------------------------------

    @action(detail=True, methods=["get"], permission_classes=[IsStaffOrAdmin])
    def registrations(self, request, slug=None):
        """GET /api/v1/events/{slug}/registrations/"""
        event = self.get_object()
        regs = event.registrations.filter(deleted_at__isnull=True).select_related("user")
        reg_status = request.query_params.get("status")
        if reg_status:
            regs = regs.filter(status=reg_status)
        serializer = EventRegistrationSerializer(regs, many=True)
        return Response(serializer.data)

    # ------------------------------------------------------------------
    # Image management
    # ------------------------------------------------------------------

    @action(
        detail=True,
        methods=["get", "post"],
        permission_classes=[AllowAny],
        url_path="images",
        parser_classes=[MultiPartParser, FormParser, JSONParser],
    )
    def images(self, request, slug=None):
        """
        GET  /api/v1/events/{slug}/images/  — list all images [public]
        POST /api/v1/events/{slug}/images/  — upload a new image [staff/admin]
        """
        event = self.get_object()

        if request.method == "GET":
            serializer = EventImageSerializer(
                event.images.all(), many=True, context={"request": request}
            )
            return Response(serializer.data)

        # POST — staff/admin only
        if not request.user.is_authenticated or request.user.role not in ("admin", "staff"):
            return Response(
                {"detail": "You do not have permission to upload images."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = EventImageWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        image = serializer.save(event=event)
        return Response(
            EventImageSerializer(image, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["patch", "delete"],
        permission_classes=[IsStaffOrAdmin],
        url_path=r"images/(?P<image_id>\d+)",
    )
    def image_detail(self, request, slug=None, image_id=None):
        """
        PATCH  /api/v1/events/{slug}/images/{id}/  — update order/alt_text
        DELETE /api/v1/events/{slug}/images/{id}/  — remove image
        """
        event = self.get_object()
        try:
            image = event.images.get(pk=image_id)
        except EventImage.DoesNotExist:
            return Response({"detail": "Image not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.method == "DELETE":
            image.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        serializer = EventImageWriteSerializer(image, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(EventImageSerializer(image, context={"request": request}).data)

    # ------------------------------------------------------------------
    # Featured events
    # ------------------------------------------------------------------

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def featured(self, request):
        """GET /api/v1/events/featured/ — up to 6 featured upcoming events."""
        qs = (
            Event.objects.filter(
                status=Event.Status.PUBLISHED,
                is_featured=True,
                deleted_at__isnull=True,
                start_date__gte=timezone.now(),
            )
            .select_related("organizer", "category")
            .order_by("start_date")[:6]
        )
        serializer = EventListSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    # ------------------------------------------------------------------
    # Upcoming events
    # ------------------------------------------------------------------

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def upcoming(self, request):
        """GET /api/v1/events/upcoming/ — next N published events."""
        limit = min(int(request.query_params.get("limit", 6)), 20)
        qs = (
            Event.objects.filter(
                status=Event.Status.PUBLISHED,
                deleted_at__isnull=True,
                start_date__gte=timezone.now(),
            )
            .select_related("organizer", "category")
            .order_by("start_date")[:limit]
        )
        serializer = EventListSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)