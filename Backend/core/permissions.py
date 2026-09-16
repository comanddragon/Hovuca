from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrReadOnly(BasePermission):
    """Full access for admins; read-only for everyone else."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsAdmin(BasePermission):
    """Only admin-role users."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsStaffOrAdmin(BasePermission):
    """Staff or admin users."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("admin", "staff")
        )


class IsOwnerOrAdmin(BasePermission):
    """Object-level: owner or admin."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == "admin":
            return True
        # Support models with `user`, `donor`, or `author` FK
        owner = (
            getattr(obj, "user", None)
            or getattr(obj, "donor", None)
            or getattr(obj, "author", None)
        )
        return owner == request.user


class IsInstructor(BasePermission):
    """The requesting user is the course instructor (object-level)."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        instructor = getattr(obj, "instructor", None)
        return instructor == request.user or request.user.role == "admin"


class IsSelfOrAdmin(BasePermission):
    """User can only access their own resource, unless admin."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == "admin":
            return True
        return obj == request.user
