from django import forms
from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import StackedInline, TabularInline

from apps.elearning.models.chapter import Chapter
from apps.elearning.models.course import Course, Subject
from apps.elearning.models.enrollment import ChapterProgress, Enrollment
from apps.elearning.models.module import Module
from apps.elearning.models.quiz import Choice, Question, Quiz, QuizAttempt
from core.admin import (
    HovucaModelAdmin as ModelAdmin,
)
from core.admin import (
    document_preview,
    image_preview,
    video_preview,
)
from core.widgets import AdminCKEditor5Widget


class ChapterAdminForm(forms.ModelForm):
    class Meta:
        model = Chapter
        fields = "__all__"
        widgets = {"content_body": AdminCKEditor5Widget(config_name="hovuca")}


class CourseAdminForm(forms.ModelForm):
    class Meta:
        model = Course
        fields = "__all__"
        widgets = {"description": AdminCKEditor5Widget(config_name="hovuca")}

# ---------------------------------------------------------------------------
# Subject
# ---------------------------------------------------------------------------


@admin.register(Subject)
class SubjectAdmin(ModelAdmin):
    list_display = ["name", "slug", "icon", "course_count", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["id", "created_at", "updated_at"]

    def course_count(self, obj):
        return obj.courses.filter(deleted_at__isnull=True).count()

    course_count.short_description = "Courses"


# ---------------------------------------------------------------------------
# Chapter inline (used inside Module)
# ---------------------------------------------------------------------------


class ChapterInline(TabularInline):
    model = Chapter
    fields = ["order", "title", "content_type", "duration_minutes", "is_preview"]
    extra = 0
    ordering = ["order"]
    show_change_link = True


# ---------------------------------------------------------------------------
# Module inline (used inside Course)
# ---------------------------------------------------------------------------


class ModuleInline(TabularInline):
    model = Module
    fields = ["order", "title", "description"]
    extra = 0
    ordering = ["order"]
    show_change_link = True


# ---------------------------------------------------------------------------
# Course
# ---------------------------------------------------------------------------


@admin.register(Course)
class CourseAdmin(ModelAdmin):
    form = CourseAdminForm
    list_display = [
        "title",
        "subject",
        "instructor",
        "difficulty_badge",
        "estimated_hours",
        "enrollment_count",
        "is_published",
        "is_free",
        "created_at",
    ]
    list_filter = ["is_published", "is_free", "difficulty", "subject", "created_at"]
    search_fields = ["title", "slug", "description", "instructor__email"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ["id", "thumbnail_preview", "enrollment_count", "created_at", "updated_at"]
    autocomplete_fields = ["instructor"]
    inlines = [ModuleInline]
    date_hierarchy = "created_at"

    fieldsets = (
        (
            "Course",
            {
                "fields": (
                    "id",
                    "subject",
                    "instructor",
                    "title",
                    "slug",
                    "description",
                    "thumbnail",
                    "thumbnail_preview",
                ),
            },
        ),
        (
            "Settings",
            {
                "fields": ("difficulty", "estimated_hours", "is_published", "is_free"),
            },
        ),
        (
            "Stats",
            {
                "classes": ("collapse",),
                "fields": ("enrollment_count",),
            },
        ),
        (
            "Timestamps",
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    actions = ["publish_courses", "unpublish_courses"]

    def difficulty_badge(self, obj):
        colors = {
            "beginner": "#10B981",
            "intermediate": "#F59E0B",
            "advanced": "#EF4444",
        }
        color = colors.get(obj.difficulty, "#6B7280")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">{}</span>',
            color,
            obj.get_difficulty_display(),
        )

    difficulty_badge.short_description = "Difficulty"

    def enrollment_count(self, obj):
        return obj.enrollments.filter(deleted_at__isnull=True).count()

    enrollment_count.short_description = "Enrollments"

    @admin.display(description="Course image preview")
    def thumbnail_preview(self, obj):
        return image_preview(obj.thumbnail, alt=obj.title)

    @admin.action(description="Publish selected courses")
    def publish_courses(self, request, queryset):
        queryset.update(is_published=True)
        self.message_user(request, "Courses published.")

    @admin.action(description="Unpublish selected courses")
    def unpublish_courses(self, request, queryset):
        queryset.update(is_published=False)
        self.message_user(request, "Courses unpublished.")


# ---------------------------------------------------------------------------
# Module
# ---------------------------------------------------------------------------


@admin.register(Module)
class ModuleAdmin(ModelAdmin):
    list_display = ["title", "course", "order", "chapter_count", "has_quiz"]
    list_filter = ["course__subject", "course"]
    search_fields = ["title", "course__title"]
    readonly_fields = ["id", "created_at", "updated_at"]
    inlines = [ChapterInline]

    def chapter_count(self, obj):
        return obj.chapters.filter(deleted_at__isnull=True).count()

    chapter_count.short_description = "Chapters"

    def has_quiz(self, obj):
        exists = hasattr(obj, "quiz") and obj.quiz is not None
        return format_html(
            '<span style="color:{};">●</span> {}',
            "#10B981" if exists else "#6B7280",
            "Yes" if exists else "No",
        )

    has_quiz.short_description = "Quiz"


# ---------------------------------------------------------------------------
# Chapter
# ---------------------------------------------------------------------------


@admin.register(Chapter)
class ChapterAdmin(ModelAdmin):
    form = ChapterAdminForm
    list_display = [
        "title",
        "module",
        "order",
        "content_type_badge",
        "duration_minutes",
        "is_preview",
    ]
    list_filter = ["content_type", "is_preview", "module__course"]
    search_fields = ["title", "module__title", "module__course__title"]
    readonly_fields = ["id", "content_file_preview", "content_url_preview", "created_at", "updated_at"]

    fieldsets = (
        (
            "Chapter",
            {
                "fields": (
                    "id",
                    "module",
                    "title",
                    "order",
                    "duration_minutes",
                    "is_preview",
                ),
            },
        ),
        (
            "Content",
            {
                "fields": (
                    "content_type",
                    "content_url",
                    "content_body",
                    "content_file",
                    "content_file_preview",
                    "content_url_preview",
                ),
            },
        ),
        (
            "Timestamps",
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    def content_type_badge(self, obj):
        colors = {
            "video": "#8B5CF6",
            "text": "#2563EB",
            "pdf": "#EF4444",
        }
        color = colors.get(obj.content_type, "#6B7280")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">{}</span>',
            color,
            obj.get_content_type_display(),
        )

    content_type_badge.short_description = "Type"

    @admin.display(description="Uploaded content preview")
    def content_file_preview(self, obj):
        if obj.content_type == Chapter.ContentType.VIDEO:
            return video_preview(obj.content_file, label=obj.title)
        return document_preview(obj.content_file, label=obj.title)

    @admin.display(description="Video URL preview")
    def content_url_preview(self, obj):
        if obj.content_type != Chapter.ContentType.VIDEO:
            return "—"
        return video_preview(obj.content_url, label=obj.title)


# ---------------------------------------------------------------------------
# Quiz
# ---------------------------------------------------------------------------


class ChoiceInline(TabularInline):
    model = Choice
    fields = ["text", "is_correct"]
    extra = 2
    min_num = 2


class QuestionInline(StackedInline):
    model = Question
    fields = ["order", "text", "question_type", "marks", "explanation"]
    extra = 0
    ordering = ["order"]
    show_change_link = True


@admin.register(Quiz)
class QuizAdmin(ModelAdmin):
    list_display = [
        "title",
        "linked_to",
        "pass_percentage",
        "time_limit_minutes",
        "max_attempts",
        "question_count",
        "is_active",
    ]
    list_filter = ["is_active", "pass_percentage"]
    search_fields = ["title", "module__title", "course__title"]
    readonly_fields = ["id", "created_at", "updated_at", "question_count"]
    inlines = [QuestionInline]

    fieldsets = (
        (
            "Quiz",
            {
                "fields": ("id", "title", "description", "is_active"),
            },
        ),
        (
            "Link",
            {
                "fields": ("module", "course"),
                "description": "Link to either a module or a course — not both.",
            },
        ),
        (
            "Rules",
            {
                "fields": ("pass_percentage", "time_limit_minutes", "max_attempts"),
            },
        ),
        (
            "Timestamps",
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    def linked_to(self, obj):
        if obj.module:
            return format_html("Module: <b>{}</b>", obj.module.title)
        if obj.course:
            return format_html("Course: <b>{}</b>", obj.course.title)
        return "—"

    linked_to.short_description = "Linked To"

    def question_count(self, obj):
        return obj.questions.count()

    question_count.short_description = "Questions"


@admin.register(Question)
class QuestionAdmin(ModelAdmin):
    list_display = ["short_text", "quiz", "question_type", "order", "marks"]
    list_filter = ["question_type", "quiz__course", "quiz__module"]
    search_fields = ["text", "quiz__title"]
    readonly_fields = ["id", "created_at", "updated_at"]
    inlines = [ChoiceInline]

    def short_text(self, obj):
        return obj.text[:80] + ("…" if len(obj.text) > 80 else "")

    short_text.short_description = "Question"


# ---------------------------------------------------------------------------
# Enrollment
# ---------------------------------------------------------------------------


class ChapterProgressInline(TabularInline):
    model = ChapterProgress
    fields = ["chapter", "completed_at"]
    readonly_fields = ["chapter", "completed_at"]
    extra = 0
    can_delete = False


@admin.register(Enrollment)
class EnrollmentAdmin(ModelAdmin):
    list_display = [
        "user",
        "course",
        "enrolled_at",
        "progress_display",
        "is_completed_badge",
        "certificate_issued",
    ]
    list_filter = ["certificate_issued", "course__subject", "course", "created_at"]
    search_fields = ["user__email", "course__title"]
    readonly_fields = [
        "id",
        "enrolled_at",
        "completed_at",
        "certificate_issued",
        "certificate_url",
        "created_at",
        "updated_at",
    ]
    inlines = [ChapterProgressInline]
    date_hierarchy = "enrolled_at"

    fieldsets = (
        (
            "Enrollment",
            {
                "fields": ("id", "user", "course", "enrolled_at", "completed_at"),
            },
        ),
        (
            "Certificate",
            {
                "fields": ("certificate_issued", "certificate_url"),
            },
        ),
        (
            "Timestamps",
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    def progress_display(self, obj):
        pct = obj.progress_percentage
        color = "#10B981" if pct >= 100 else "#3B82F6"
        return format_html(
            '<div style="width:100px;background:#E5E7EB;border-radius:4px;overflow:hidden;display:inline-block;">'
            '<div style="width:{pct}%;background:{color};height:12px;"></div></div> {pct}%',
            pct=min(pct, 100),
            color=color,
        )

    progress_display.short_description = "Progress"

    def is_completed_badge(self, obj):
        if obj.is_completed:
            return format_html(
                '<span style="color:#10B981;font-weight:bold;">{}</span>',
                "✓ Completed",
            )
        return format_html('<span style="color:#6B7280;">{}</span>', "In Progress")

    is_completed_badge.short_description = "Status"

    actions = ["issue_certificates"]

    @admin.action(description="Issue certificates for selected enrollments")
    def issue_certificates(self, request, queryset):
        completed = queryset.filter(completed_at__isnull=False)
        updated = completed.update(certificate_issued=True)
        self.message_user(request, f"{updated} certificate(s) issued.")


@admin.register(QuizAttempt)
class QuizAttemptAdmin(ModelAdmin):
    list_display = [
        "user",
        "quiz",
        "score",
        "max_score",
        "percentage_display",
        "passed_badge",
        "started_at",
        "completed_at",
    ]
    list_filter = ["passed", "quiz__course", "created_at"]
    search_fields = ["user__email", "quiz__title"]
    readonly_fields = ["id", "started_at", "completed_at", "created_at", "updated_at"]

    def percentage_display(self, obj):
        pct = obj.percentage
        color = "#10B981" if pct >= 50 else "#EF4444"
        return format_html('<b style="color:{};">{}%</b>', color, pct)

    percentage_display.short_description = "%"

    def passed_badge(self, obj):
        if obj.passed:
            return format_html(
                '<span style="color:#10B981;font-weight:bold;">{}</span>',
                "✓ Passed",
            )
        return format_html('<span style="color:#EF4444;">{}</span>', "✗ Failed")

    passed_badge.short_description = "Result"
