from django.db import models
from apps.core.models import BaseModel


class Quiz(BaseModel):
    """
    A quiz that belongs to either a Module (mid-module check) or
    a Course (final assessment). Exactly one FK should be set.
    """

    module = models.OneToOneField(
        "elearning.Module",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="quiz",
    )
    course = models.OneToOneField(
        "elearning.Course",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="final_quiz",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    pass_percentage = models.PositiveSmallIntegerField(default=70)  # 0-100
    time_limit_minutes = models.PositiveSmallIntegerField(
        null=True, blank=True, help_text="Leave blank for no time limit."
    )
    max_attempts = models.PositiveSmallIntegerField(
        default=0, help_text="0 = unlimited attempts."
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "elearning_quizzes"
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(module__isnull=False, course__isnull=True)
                    | models.Q(module__isnull=True, course__isnull=False)
                ),
                name="quiz_belongs_to_module_or_course",
            )
        ]

    def __str__(self):
        parent = self.module or self.course
        return f"Quiz: {self.title} ({parent})"


class Question(BaseModel):
    """A single question inside a Quiz."""

    class QuestionType(models.TextChoices):
        MCQ = "mcq", "Multiple Choice"
        TRUE_FALSE = "true_false", "True / False"

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    text = models.TextField()
    question_type = models.CharField(
        max_length=15, choices=QuestionType.choices, default=QuestionType.MCQ
    )
    order = models.PositiveSmallIntegerField(default=0)
    marks = models.PositiveSmallIntegerField(default=1)
    explanation = models.TextField(blank=True, help_text="Shown after answering.")

    class Meta:
        db_table = "elearning_questions"
        ordering = ["order"]

    def __str__(self):
        return f"Q{self.order}: {self.text[:60]}"


class Choice(BaseModel):
    """An answer option for a Question."""

    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="choices"
    )
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)

    class Meta:
        db_table = "elearning_choices"

    def __str__(self):
        marker = "✓" if self.is_correct else "✗"
        return f"{marker} {self.text[:60]}"


class QuizAttempt(BaseModel):
    """Tracks a single attempt by a user on a Quiz."""

    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="quiz_attempts"
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    max_score = models.PositiveSmallIntegerField(default=0)
    passed = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "elearning_quiz_attempts"
        ordering = ["-started_at"]

    def __str__(self):
        status = "Passed" if self.passed else "Failed"
        return f"{self.user.get_full_name()} — {self.quiz.title} [{status}]"

    @property
    def percentage(self):
        if self.max_score:
            return round((float(self.score) / self.max_score) * 100, 2)
        return 0


class QuizAnswer(BaseModel):
    """The choice a user selected for a given question in an attempt."""

    attempt = models.ForeignKey(
        QuizAttempt, on_delete=models.CASCADE, related_name="answers"
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="answers"
    )
    selected_choice = models.ForeignKey(
        Choice,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="selected_in",
    )
    is_correct = models.BooleanField(default=False)

    class Meta:
        db_table = "elearning_quiz_answers"
        unique_together = [("attempt", "question")]

    def __str__(self):
        return f"{self.attempt} / Q: {self.question.order}"
