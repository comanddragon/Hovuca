from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.pagination import StandardPagination

from apps.notifications.models import Notification
from .serializers import NotificationSerializer, NotificationMarkReadSerializer

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET    /api/v1/notifications/            — list own notifications
    GET    /api/v1/notifications/{id}/       — retrieve single notification
    POST   /api/v1/notifications/mark-read/  — mark one or many as read
    POST   /api/v1/notifications/mark-all-read/ — mark all unread as read
    DELETE /api/v1/notifications/{id}/       — delete a notification
    GET    /api/v1/notifications/unread-count/ — count of unread
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        qs = Notification.objects.filter(
            recipient=self.request.user,
            deleted_at__isnull=True,
        ).order_by("-created_at")

        notification_type = self.request.query_params.get("type")
        is_read = self.request.query_params.get("is_read")

        if notification_type:
            qs = qs.filter(notification_type=notification_type)
        if is_read is not None:
            qs = qs.filter(is_read=is_read.lower() == "true")

        return qs

    def destroy(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        """GET /api/v1/notifications/unread-count/"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"unread_count": count})

    # @action(detail=True, methods=["post"])
    # def mark_read(self, request, pk=None):
    #     """
    #     POST /api/v1/notifications/mark-read/
    #     Body: { "notification_ids": ["uuid1", "uuid2"] }
    #     """
    #     serializer = NotificationMarkReadSerializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)
    #     ids = serializer.validated_data["notification_ids"]
    #
    #     updated = Notification.objects.filter(
    #         id__in=ids,
    #         recipient=request.user,
    #         is_read=False,
    #         deleted_at__isnull=True,
    #     ).update(is_read=True, read_at=timezone.now())
    #
    #     return Response({"detail": f"{updated} notification(s) marked as read."})

    @action(detail=True, methods=["post"], url_path="mark_read")
    def mark_read(self, request, pk=None):
        notification = self.get_queryset().filter(
            pk=pk,
            recipient=request.user,
            is_read=False,
            deleted_at__isnull=True,
        ).first()

        if not notification:
            return Response(
                {"detail": "Notification not found or already read."},
                status=status.HTTP_404_NOT_FOUND,
            )

        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=["is_read", "read_at"])

        return Response({"detail": "Notification marked as read."})

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        """POST /api/v1/notifications/mark-all-read/"""
        updated = Notification.objects.filter(
            recipient=request.user,
            is_read=False,
            deleted_at__isnull=True,
        ).update(is_read=True, read_at=timezone.now())
        return Response({"detail": f"{updated} notification(s) marked as read."})