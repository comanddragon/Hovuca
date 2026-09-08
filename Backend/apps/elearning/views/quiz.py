from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.pagination import StandardPagination
from core.permissions import IsAdmin, IsStaffOrAdmin

from apps.elearning.models.quiz import Quiz, Question, Choice, QuizAttempt, QuizAnswer
from apps.elearning.models.enrollment import Enrollment
from apps.elearning.serializers.quiz import (
    QuizListSerializer,
    QuizDetailSerializer,
    QuizPublicSerializer,
    QuizWriteSerializer,
    QuestionSerializer,
    QuizSubmitSerializer,
    QuizAttemptListSerializer,
    QuizAttemptDetailSerializer,
)


class QuizViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/elearning/quizzes/                    [enrolled | staff/admin]
    POST   /api/v1/elearning/quizzes/                    [staff/admin]
    GET    /api/v1/elearning/quizzes/{id}/               [enrolled | staff/admin]
    PATCH  /api/v1/elearning/quizzes/{id}/               [staff/admin]
    DELETE /api/v1/elearning/quizzes/{id}/               [admin]
    POST   /api/v1/elearning/quizzes/{id}/submit/        [enrolled student]
    GET    /api/v1/elearning/quizzes/{id}/attempts/      [enrolled | staff/admin]
    GET    /api/v1/elearning/quizzes/{id}/leaderboard/   [authenticated]
    """

    queryset = (
        Quiz.objects.filter(deleted_at__isnull=True)
        .select_related("module", "course")
        .prefetch_related("questions__choices")
        .order_by("-created_at")
    )
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update"):
            return [IsStaffOrAdmin()]
        if self.action == "destroy":
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        user = self.request.user
        is_staff = user.is_authenticated and user.role in ("admin", "staff")

        if self.action == "list":
            return QuizListSerializer
        if self.action in ("create", "update", "partial_update"):
            return QuizWriteSerializer
        if self.action == "retrieve":
            return QuizDetailSerializer if is_staff else QuizPublicSerializer
        return QuizDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        qs = qs.filter(is_active=True)
        module_id = self.request.query_params.get("module")
        course_id = self.request.query_params.get("course")
        if module_id:
            qs = qs.filter(module_id=module_id)
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs

    def perform_destroy(self, instance):
        instance.soft_delete()

    def _get_enrollment_for_quiz(self, request, quiz):
        """Resolve the enrollment a student needs to attempt this quiz."""
        course = quiz.course or (quiz.module.course if quiz.module else None)
        if not course:
            return None
        try:
            return Enrollment.objects.get(user=request.user, course=course)
        except Enrollment.DoesNotExist:
            return None

    def _check_attempt_limit(self, quiz, user):
        """Returns True if the user can still attempt the quiz."""
        if quiz.max_attempts == 0:
            return True
        attempt_count = QuizAttempt.objects.filter(
            quiz=quiz, user=user, completed_at__isnull=False
        ).count()
        return attempt_count < quiz.max_attempts

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    @transaction.atomic
    def submit(self, request, pk=None):
        """
        POST /api/v1/elearning/quizzes/{id}/submit/
        Grades the attempt and returns results immediately.
        """
        quiz = self.get_object()
        user = request.user

        # Enrollment check (staff/admin bypass)
        if user.role not in ("admin", "staff"):
            enrollment = self._get_enrollment_for_quiz(request, quiz)
            if not enrollment:
                return Response(
                    {
                        "detail": "You must be enrolled in this course to attempt the quiz."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
            if not self._check_attempt_limit(quiz, user):
                return Response(
                    {
                        "detail": f"You have reached the maximum number of attempts ({quiz.max_attempts})."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = QuizSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answers_data = serializer.validated_data["answers"]

        # Build lookup maps
        question_ids = [a["question_id"] for a in answers_data]
        choice_ids = [a["selected_choice_id"] for a in answers_data]

        questions = {str(q.id): q for q in quiz.questions.filter(id__in=question_ids)}
        choices = {str(c.id): c for c in Choice.objects.filter(id__in=choice_ids)}

        # Grade
        total_marks = sum(q.marks for q in questions.values())
        earned_marks = 0
        attempt = QuizAttempt.objects.create(
            user=user, quiz=quiz, max_score=total_marks
        )

        quiz_answers = []
        for answer_data in answers_data:
            q_id = str(answer_data["question_id"])
            c_id = str(answer_data["selected_choice_id"])
            question = questions.get(q_id)
            choice = choices.get(c_id)

            if not question or not choice:
                continue
            if str(choice.question_id) != q_id:
                continue  # Choice doesn't belong to this question

            is_correct = choice.is_correct
            if is_correct:
                earned_marks += question.marks

            quiz_answers.append(
                QuizAnswer(
                    attempt=attempt,
                    question=question,
                    selected_choice=choice,
                    is_correct=is_correct,
                )
            )

        QuizAnswer.objects.bulk_create(quiz_answers)

        # Finalise attempt
        passed = (
            total_marks > 0
            and (earned_marks / total_marks * 100) >= quiz.pass_percentage
        )
        attempt.score = earned_marks
        attempt.passed = passed
        attempt.completed_at = timezone.now()
        attempt.save(update_fields=["score", "passed", "completed_at"])

        return Response(
            QuizAttemptDetailSerializer(attempt).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def attempts(self, request, pk=None):
        """
        GET /api/v1/elearning/quizzes/{id}/attempts/
        Staff/admin see all attempts; students see only their own.
        """
        quiz = self.get_object()
        user = request.user

        if user.role in ("admin", "staff"):
            qs = quiz.attempts.select_related("user").order_by("-started_at")
        else:
            qs = quiz.attempts.filter(user=user).order_by("-started_at")

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = QuizAttemptListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(QuizAttemptListSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def leaderboard(self, request, pk=None):
        """
        GET /api/v1/elearning/quizzes/{id}/leaderboard/
        Top 10 passing scores for this quiz (used by the WebSocket live leaderboard).
        """
        from django.db.models import Max
        from apps.accounts.serializers import UserPublicSerializer

        quiz = self.get_object()
        top = (
            QuizAttempt.objects.filter(quiz=quiz, passed=True)
            .values("user")
            .annotate(best_score=Max("score"))
            .order_by("-best_score")[:10]
        )
        user_ids = [row["user"] for row in top]
        from apps.accounts.models import User

        users = {str(u.id): u for u in User.objects.filter(id__in=user_ids)}

        leaderboard = [
            {
                "rank": idx + 1,
                "user": UserPublicSerializer(users[str(row["user"])]).data,
                "best_score": row["best_score"],
            }
            for idx, row in enumerate(top)
            if str(row["user"]) in users
        ]
        return Response({"quiz_id": str(quiz.id), "leaderboard": leaderboard})


class QuestionViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD for quiz questions.
    GET    /api/v1/elearning/questions/       ?quiz=<uuid>
    POST   /api/v1/elearning/questions/       [staff/admin]
    PATCH  /api/v1/elearning/questions/{id}/  [staff/admin]
    DELETE /api/v1/elearning/questions/{id}/  [admin]
    """

    queryset = (
        Question.objects.filter(deleted_at__isnull=True)
        .select_related("quiz")
        .prefetch_related("choices")
        .order_by("order")
    )
    serializer_class = QuestionSerializer
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update"):
            return [IsStaffOrAdmin()]
        if self.action == "destroy":
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        quiz_id = self.request.query_params.get("quiz")
        if quiz_id:
            qs = qs.filter(quiz_id=quiz_id)
        return qs

    def perform_destroy(self, instance):
        instance.soft_delete()
