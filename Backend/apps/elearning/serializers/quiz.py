from rest_framework import serializers

from apps.accounts.api.serializers import UserPublicSerializer
from apps.elearning.models.quiz import (
    Quiz,
    Question,
    Choice,
    QuizAttempt,
    QuizAnswer,
)


# ---------------------------------------------------------------------------
# Choice
# ---------------------------------------------------------------------------


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "text", "is_correct"]
        read_only_fields = ["id"]


class ChoicePublicSerializer(serializers.ModelSerializer):
    """Hides is_correct — shown to students during an active attempt."""

    class Meta:
        model = Choice
        fields = ["id", "text"]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Question
# ---------------------------------------------------------------------------


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True)

    class Meta:
        model = Question
        fields = [
            "id",
            "quiz",
            "text",
            "question_type",
            "order",
            "marks",
            "explanation",
            "choices",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        choices_data = validated_data.pop("choices", [])
        question = Question.objects.create(**validated_data)
        for choice_data in choices_data:
            Choice.objects.create(question=question, **choice_data)
        return question

    def update(self, instance, validated_data):
        choices_data = validated_data.pop("choices", None)
        instance = super().update(instance, validated_data)
        if choices_data is not None:
            instance.choices.all().delete()
            for choice_data in choices_data:
                Choice.objects.create(question=instance, **choice_data)
        return instance

    def validate_choices(self, value):
        if not value:
            raise serializers.ValidationError("At least one choice is required.")
        correct_count = sum(1 for c in value if c.get("is_correct"))
        if correct_count == 0:
            raise serializers.ValidationError(
                "At least one choice must be marked correct."
            )
        return value


class QuestionPublicSerializer(serializers.ModelSerializer):
    """For students — hides correct answers and explanation until after submission."""

    choices = ChoicePublicSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "text", "question_type", "order", "marks", "choices"]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Quiz
# ---------------------------------------------------------------------------


class QuizListSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "module",
            "course",
            "pass_percentage",
            "time_limit_minutes",
            "max_attempts",
            "is_active",
            "question_count",
            "created_at",
        ]
        read_only_fields = fields

    def get_question_count(self, obj):
        return obj.questions.count()


class QuizDetailSerializer(serializers.ModelSerializer):
    """Admin view — includes correct answers."""

    questions = QuestionSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "description",
            "module",
            "course",
            "pass_percentage",
            "time_limit_minutes",
            "max_attempts",
            "is_active",
            "question_count",
            "questions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_question_count(self, obj):
        return obj.questions.count()

    def validate(self, attrs):
        module = attrs.get("module")
        course = attrs.get("course")
        if not module and not course:
            raise serializers.ValidationError(
                "A quiz must be linked to either a module or a course."
            )
        if module and course:
            raise serializers.ValidationError(
                "A quiz cannot be linked to both a module and a course."
            )
        return attrs


class QuizPublicSerializer(serializers.ModelSerializer):
    """Student view — hides correct answers."""

    questions = QuestionPublicSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            "id",
            "title",
            "description",
            "pass_percentage",
            "time_limit_minutes",
            "max_attempts",
            "question_count",
            "questions",
        ]
        read_only_fields = fields

    def get_question_count(self, obj):
        return obj.questions.count()


class QuizWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = [
            "module",
            "course",
            "title",
            "description",
            "pass_percentage",
            "time_limit_minutes",
            "max_attempts",
            "is_active",
        ]

    def validate(self, attrs):
        return QuizDetailSerializer.validate(self, attrs)


# ---------------------------------------------------------------------------
# Quiz Submission (student submits answers)
# ---------------------------------------------------------------------------


class QuizAnswerSubmitSerializer(serializers.Serializer):
    question_id = serializers.UUIDField()
    selected_choice_id = serializers.UUIDField()


class QuizSubmitSerializer(serializers.Serializer):
    """
    Payload for submitting a quiz attempt.
    Expected: { "answers": [{"question_id": ..., "selected_choice_id": ...}] }
    """

    answers = QuizAnswerSubmitSerializer(many=True)

    def validate_answers(self, value):
        if not value:
            raise serializers.ValidationError("At least one answer is required.")
        return value


# ---------------------------------------------------------------------------
# Quiz Attempt
# ---------------------------------------------------------------------------


class QuizAnswerResultSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)
    selected_choice = ChoiceSerializer(read_only=True)

    class Meta:
        model = QuizAnswer
        fields = ["id", "question", "selected_choice", "is_correct"]
        read_only_fields = fields


class QuizAttemptListSerializer(serializers.ModelSerializer):
    percentage = serializers.ReadOnlyField()

    class Meta:
        model = QuizAttempt
        fields = [
            "id",
            "quiz",
            "score",
            "max_score",
            "percentage",
            "passed",
            "started_at",
            "completed_at",
        ]
        read_only_fields = fields


class QuizAttemptDetailSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    percentage = serializers.ReadOnlyField()
    answers = QuizAnswerResultSerializer(many=True, read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            "id",
            "user",
            "quiz",
            "score",
            "max_score",
            "percentage",
            "passed",
            "started_at",
            "completed_at",
            "answers",
        ]
        read_only_fields = fields
