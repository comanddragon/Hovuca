from .course import SubjectSerializer, CourseListSerializer, CourseDetailSerializer
from .module import ModuleListSerializer, ModuleDetailSerializer, ModuleWriteSerializer
from .chapter import (
    ChapterListSerializer,
    ChapterDetailSerializer,
    ChapterWriteSerializer,
)
from .quiz import (
    ChoiceSerializer,
    QuestionSerializer,
    QuizListSerializer,
    QuizDetailSerializer,
    QuizPublicSerializer,
    QuizWriteSerializer,
    QuizSubmitSerializer,
    QuizAttemptListSerializer,
    QuizAttemptDetailSerializer,
)
from .enrollment import (
    EnrollmentListSerializer,
    EnrollmentDetailSerializer,
    EnrollSerializer,
    ChapterProgressSerializer,
    MarkChapterCompleteSerializer,
)

__all__ = [
    # Course
    "SubjectSerializer",
    "CourseListSerializer",
    "CourseDetailSerializer",
    # Module
    "ModuleListSerializer",
    "ModuleDetailSerializer",
    "ModuleWriteSerializer",
    # Chapter
    "ChapterListSerializer",
    "ChapterDetailSerializer",
    "ChapterWriteSerializer",
    # Quiz
    "ChoiceSerializer",
    "QuestionSerializer",
    "QuizListSerializer",
    "QuizDetailSerializer",
    "QuizPublicSerializer",
    "QuizWriteSerializer",
    "QuizSubmitSerializer",
    "QuizAttemptListSerializer",
    "QuizAttemptDetailSerializer",
    # Enrollment
    "EnrollmentListSerializer",
    "EnrollmentDetailSerializer",
    "EnrollSerializer",
    "ChapterProgressSerializer",
    "MarkChapterCompleteSerializer",
]
