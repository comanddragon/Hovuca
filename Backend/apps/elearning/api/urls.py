from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.elearning.views import (
    SubjectViewSet,
    CourseViewSet,
    ModuleViewSet,
    ChapterViewSet,
    QuizViewSet,
    QuestionViewSet,
    EnrollmentViewSet,
)

router = DefaultRouter()
router.register("subjects", SubjectViewSet, basename="subject")
router.register("courses", CourseViewSet, basename="course")
router.register("modules", ModuleViewSet, basename="module")
router.register("chapters", ChapterViewSet, basename="chapter")
router.register("quizzes", QuizViewSet, basename="quiz")
router.register("questions", QuestionViewSet, basename="question")
router.register("enrollments", EnrollmentViewSet, basename="enrollment")

urlpatterns = [
    path("", include(router.urls)),
]
