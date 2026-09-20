from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ChangePasswordView,
    ForgotPasswordView,
    LoginView,
    LogoutView,
    MyProfileView,
    RefreshTokenView,
    RegisterView,
    ResetPasswordConfirmView,
    UserViewSet,
    WebSocketTicketView,
)

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")

urlpatterns = [
    # Auth endpoints
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", RefreshTokenView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("ws-ticket/", WebSocketTicketView.as_view(), name="websocket-ticket"),
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MyProfileView.as_view(), name="my-profile"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    # Admin user management
path("forgot-password/", ForgotPasswordView.as_view()),
path("reset-password/", ResetPasswordConfirmView.as_view()),
    path("", include(router.urls)),
]

# apps/accounts/urls.py
