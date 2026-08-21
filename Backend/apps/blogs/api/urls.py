from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ArticleViewSet, CategoryViewSet, TagViewSet, CommentViewSet

router = DefaultRouter()
router.register("articles", ArticleViewSet, basename="article")
router.register("categories", CategoryViewSet, basename="blog-category")
router.register("tags", TagViewSet, basename="blog-tag")
router.register("comments", CommentViewSet, basename="blog-comment")

urlpatterns = [
    path("", include(router.urls)),
]
