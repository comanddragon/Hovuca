from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.models import User
from core.pagination import StandardPagination
from core.permissions import IsAdmin
from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
    UserListSerializer,
    UserProfileSerializer,
    ForgotPasswordSerializer,
    ResetPasswordConfirmSerializer,
)


def get_frontend_url(request):
    """Derive the frontend origin from the request headers."""
    origin = request.META.get("HTTP_ORIGIN")
    if origin:
        return origin
    scheme = "https" if request.is_secure() else "http"
    return f"{scheme}://{request.get_host()}"


# ---------------------------------------------------------------------------
# Auth — Login / Logout / Refresh
# ---------------------------------------------------------------------------


class LoginView(TokenObtainPairView):
    """POST /api/v1/auth/login/"""

    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = response.data.get("user")
            user_id = user["id"] if user else None
            if user_id:
                from apps.accounts.tasks import update_last_login_ip
                update_last_login_ip.delay(str(user_id), self._get_client_ip(request))
        return response

    def _get_client_ip(self, request):
        x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded:
            return x_forwarded.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")


class RefreshTokenView(TokenRefreshView):
    """POST /api/v1/auth/token/refresh/"""
    pass


class LogoutView(generics.GenericAPIView):
    """POST /api/v1/auth/logout/ — blacklists the provided refresh token."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"detail": "Logged out successfully."}, status=status.HTTP_200_OK
            )
        except Exception:
            return Response(
                {"detail": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/"""

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Fire-and-forget — does not block the response
        try:
            from apps.accounts.tasks import send_welcome_email
            send_welcome_email.delay(str(user.id), get_frontend_url(request))
        except Exception:
            pass

        tokens = RefreshToken.for_user(user)
        return Response(
            {
                "detail": "Registration successful.",
                "user": UserProfileSerializer(user).data,
                "tokens": {
                    "access": str(tokens.access_token),
                    "refresh": str(tokens),
                },
            },
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# My Profile
# ---------------------------------------------------------------------------


class MyProfileView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/v1/auth/me/  — retrieve own profile
    PATCH /api/v1/auth/me/  — update own profile
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UpdateProfileSerializer
        return UserProfileSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """POST /api/v1/auth/change-password/"""

    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["post"]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Password changed successfully."},
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Password reset
# ---------------------------------------------------------------------------


class ForgotPasswordView(APIView):
    """
    POST /api/v1/auth/forgot-password/
    { "email": "user@example.com" }
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(
            data=request.data,
            context={"frontend_url": get_frontend_url(request)},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "If the email exists, a reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class ResetPasswordConfirmView(APIView):
    """
    POST /api/v1/auth/reset-password/
    { "uid": "...", "token": "...", "password": "newpass123" }
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Password reset successful."},
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Admin — User Management
# ---------------------------------------------------------------------------


class UserViewSet(viewsets.ModelViewSet):
    """
    Admin-only CRUD for users.
    GET    /api/v1/users/
    POST   /api/v1/users/
    GET    /api/v1/users/{id}/
    PATCH  /api/v1/users/{id}/
    DELETE /api/v1/users/{id}/
    POST   /api/v1/users/{id}/deactivate/
    POST   /api/v1/users/{id}/activate/
    """

    queryset = User.objects.all().order_by("-created_at")
    permission_classes = [IsAdmin]
    pagination_class = StandardPagination

    def get_serializer_class(self):
        if self.action == "list":
            return UserListSerializer
        if self.action == "create":
            return RegisterSerializer
        return UserProfileSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get("role")
        is_active = self.request.query_params.get("is_active")
        search = self.request.query_params.get("search")

        if role:
            qs = qs.filter(role=role)
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == "true")
        if search:
            qs = (
                qs.filter(email__icontains=search)
                | qs.filter(first_name__icontains=search)
                | qs.filter(last_name__icontains=search)
            )
        return qs

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response({"detail": f"{user.email} deactivated."})

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=["is_active"])
        return Response({"detail": f"{user.email} activated."})