"""Explicitly scoped API for the frontend operations workspace.

The catalog is an allowlist, never an arbitrary model/field API. Credentials,
permission groups and payment mutations are deliberately not exposed.
"""

import json
from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal

from django.apps import apps
from django.contrib.admin.models import ADDITION, CHANGE, LogEntry
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, models, transaction
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDate
from django.shortcuts import get_object_or_404
from django.urls import path
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from core.pagination import StandardPagination


@dataclass(frozen=True)
class Resource:
    model: str
    title: str
    group: str
    columns: tuple
    readonly: tuple = ()
    only: tuple = ()
    admin_only: bool = False
    create: bool = True
    edit: bool = True
    archive: bool = True


CATALOG = {
    "programs": Resource("programs.Program", "Programs", "Impact", ("title", "status", "organization", "target_beneficiaries")),
    "projects": Resource("programs.Project", "Projects", "Impact", ("title", "program", "status", "location", "source_year")),
    "activities": Resource("programs.ProjectActivity", "Project activities", "Impact", ("title", "project", "evidence_status", "period")),
    "topics": Resource("programs.Topic", "Topics", "Content", ("name", "parent", "is_active", "order")),
    "organizations": Resource("organization.Organization", "Organizations", "Organization", ("name", "email", "is_active")),
    "branches": Resource("organization.Branch", "Branches", "Organization", ("name", "organization", "location", "is_active")),
    "departments": Resource("organization.Department", "Departments", "Organization", ("name", "branch", "head")),
    "events": Resource("events.Event", "Events", "Community", ("title", "status", "start_date", "event_type"), readonly=("view_count",)),
    "event-categories": Resource("events.EventCategory", "Event categories", "Community", ("name", "is_active")),
    "event-images": Resource("events.EventImage", "Event images", "Community", ("event", "alt_text", "order")),
    "registrations": Resource("events.EventRegistration", "Event registrations", "Community", ("event", "user", "status", "checked_in_at"), readonly=("event", "user", "notes"), create=False),
    "albums": Resource("gallery.GalleryAlbum", "Gallery albums", "Content", ("title", "is_published", "is_featured", "taken_at")),
    "media": Resource("gallery.GalleryImage", "Gallery media", "Content", ("title", "album", "media_type", "order"), readonly=("view_count",)),
    "resources": Resource("blogs.Resource", "Documents", "Content", ("title", "category", "is_active", "published_at")),
    "categories": Resource("blogs.Category", "Article categories", "Content", ("name", "is_active")),
    "tags": Resource("blogs.Tag", "Article tags", "Content", ("name", "slug")),
    "comments": Resource("blogs.Comment", "Comment moderation", "Content", ("body", "article", "author", "is_approved"), readonly=("body", "article", "author", "parent"), create=False),
    "subscribers": Resource("blogs.NewsletterSubscriber", "Newsletter subscribers", "Community", ("email", "is_active", "source"), readonly=("email", "source"), create=False),
    "applications": Resource("volunteers.VolunteerApplication", "Volunteer applications", "People", ("full_name", "email", "status", "created_at"), only=("status",), create=False),
    "volunteers": Resource("volunteers.VolunteerProfile", "Volunteer profiles", "People", ("user", "availability", "department", "hours_contributed")),
    "tasks": Resource("volunteers.VolunteerTask", "Volunteer tasks", "People", ("title", "volunteer", "status", "due_date")),
    "messages": Resource("organization.ContactMessage", "Contact inbox", "Community", ("subject", "full_name", "topic", "status"), only=("status",), create=False),
    "campaigns": Resource("donations.DonationCampaign", "Fundraising campaigns", "Funding", ("title", "status", "goal_amount", "raised_amount"), readonly=("raised_amount",)),
    "donations": Resource("donations.Donation", "Donation transactions", "Funding", ("donor", "amount", "currency", "status", "created_at"), create=False, edit=False, archive=False),
    "payment-settings": Resource("donations.DonationPaymentSettings", "Payment details", "Funding", ("bank_name", "account_name", "bank_currency"), admin_only=True, archive=False),
    "partners": Resource("donors.DonorOrganization", "Funding partners", "Funding", ("name", "status", "type", "tier"), readonly=("total_funded", "first_funded_at", "last_funded_at")),
    "partner-contacts": Resource("donors.DonorContact", "Partner contacts", "Funding", ("first_name", "last_name", "organization", "email")),
    "grants": Resource("donors.Grant", "Grants", "Funding", ("title", "donor_organization", "amount", "currency", "status")),
    "engagements": Resource("donors.DonorEngagement", "Partner engagements", "Funding", ("organization", "type", "date", "summary")),
    "subjects": Resource("elearning.Subject", "Learning subjects", "Learning", ("name", "is_active")),
    "courses": Resource("elearning.Course", "Courses", "Learning", ("title", "subject", "difficulty", "is_published")),
    "modules": Resource("elearning.Module", "Course modules", "Learning", ("title", "course", "order")),
    "chapters": Resource("elearning.Chapter", "Lessons", "Learning", ("title", "module", "order")),
    "quizzes": Resource("elearning.Quiz", "Quizzes", "Learning", ("title", "module", "pass_percentage")),
    "questions": Resource("elearning.Question", "Quiz questions", "Learning", ("quiz", "question_type", "order")),
    "choices": Resource("elearning.Choice", "Answer choices", "Learning", ("question", "text", "is_correct")),
    "enrollments": Resource("elearning.Enrollment", "Enrollments", "Learning", ("user", "course", "enrolled_at", "completed_at"), create=False, edit=False, archive=False),
    "quiz-attempts": Resource("elearning.QuizAttempt", "Quiz results", "Learning", ("user", "quiz", "score", "passed"), create=False, edit=False, archive=False),
    "users": Resource("accounts.User", "User accounts", "People", ("email", "first_name", "last_name", "role", "is_active"), only=("email", "first_name", "last_name", "phone_number", "role", "is_active"), admin_only=True, archive=False),
}

SYSTEM_FIELDS = {"id", "created_at", "updated_at", "deleted_at", "password", "last_login", "last_login_ip", "is_superuser", "is_staff", "is_email_verified", "user_permissions", "groups"}
ADMIN_WRITE_MODELS = {
    "organization.Organization", "organization.Branch", "organization.Department",
    "blogs.Category", "events.EventCategory", "donors.DonorOrganization",
    "donors.DonorContact", "donors.Grant", "volunteers.VolunteerProfile",
}


class WorkspacePermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_active and (user.is_superuser or user.role in ("admin", "staff")))


def is_admin(user):
    return user.is_superuser or user.role == "admin"


def resource_for(key, user):
    if key not in CATALOG:
        from rest_framework.exceptions import NotFound
        raise NotFound("Unknown admin section.")
    resource = CATALOG[key]
    if resource.admin_only and not is_admin(user):
        raise PermissionDenied("This section requires an administrator.")
    return resource


def model_for(resource):
    return apps.get_model(resource.model)


def visible_fields(resource):
    return [field for field in model_for(resource)._meta.get_fields() if not field.auto_created and field.name not in SYSTEM_FIELDS and (field.concrete or field.many_to_many)]


def serializer_for(resource):
    model = model_for(resource)
    fields = visible_fields(resource)
    names = ["id", *[field.name for field in fields], "created_at", "updated_at"]
    if hasattr(model, "deleted_at"):
        names.append("deleted_at")
    readonly = [name for name in names if name in SYSTEM_FIELDS]
    readonly += [field.name for field in fields if not resource.edit or not field.editable or field.name in resource.readonly or (resource.only and field.name not in resource.only)]
    attributes = {}
    if model._meta.label_lower == "accounts.user":
        names.append("initial_password")
        attributes["initial_password"] = serializers.CharField(write_only=True, required=False, trim_whitespace=False)
    attributes["Meta"] = type("Meta", (), {"model": model, "fields": names, "read_only_fields": readonly})
    return type(f"{model.__name__}WorkspaceSerializer", (WorkspaceSerializer,), attributes)


class WorkspaceSerializer(serializers.ModelSerializer):
    def to_internal_value(self, data):
        if "payload" in data:
            try:
                values = json.loads(data["payload"])
                if not isinstance(values, dict):
                    raise ValueError
            except (ValueError, TypeError):
                raise ValidationError({"detail": "Invalid form payload."})
            for name in data:
                if name != "payload":
                    values[name] = data[name]
            data = values
        unknown = set(data) - set(self.fields)
        locked = {name for name in data if name in self.fields and self.fields[name].read_only}
        if unknown or locked:
            raise ValidationError({name: ["This field cannot be changed."] for name in unknown | locked})
        return super().to_internal_value(data)

    def validate(self, attrs):
        model = self.Meta.model
        from apps.elearning.models.chapter import sanitize_chapter_body
        for field in model._meta.fields:
            if field.__class__.__name__ == "CKEditor5Field" and field.name in attrs:
                attrs[field.name] = sanitize_chapter_body(attrs[field.name])
        candidate = model()
        if self.instance:
            for field in model._meta.concrete_fields:
                setattr(candidate, field.attname, getattr(self.instance, field.attname))
            candidate._state.adding = False
        for name, value in attrs.items():
            if name == "initial_password":
                continue
            field = model._meta.get_field(name)
            if not field.many_to_many:
                setattr(candidate, name, value)
        errors = {}
        if model._meta.label_lower == "accounts.user":
            password = attrs.get("initial_password")
            if self.instance and password is not None:
                errors["initial_password"] = ["Use the account password reset flow to change credentials."]
            elif not self.instance:
                candidate.set_unusable_password()
                if not password:
                    errors["initial_password"] = ["An initial password is required."]
                else:
                    try:
                        validate_password(password, candidate)
                    except DjangoValidationError as exc:
                        errors["initial_password"] = exc.messages
        for start, end in (("start_date", "end_date"), ("age_min", "age_max")):
            a, b = getattr(candidate, start, None), getattr(candidate, end, None)
            if a is not None and b is not None and b < a:
                errors[end] = [f"Must be on or after {start.replace('_', ' ')}."]
        if model._meta.label_lower == "events.event" and candidate.start_date and candidate.end_date and candidate.end_date <= candidate.start_date:
            errors["end_date"] = ["End date must be after start date."]
        for field in model._meta.fields:
            if field.name in attrs and isinstance(field, models.FileField) and attrs[field.name]:
                upload = attrs[field.name]
                if upload.size > 25 * 1024 * 1024:
                    errors[field.name] = ["Files must be 25 MB or smaller."]
                if upload.name.lower().endswith((".html", ".htm", ".svg", ".js", ".exe", ".php")):
                    errors[field.name] = ["This file type is not supported."]
        for name in ("budget", "raised_amount", "goal_amount", "amount", "hours_logged"):
            value = getattr(candidate, name, None)
            if value is not None and value < 0:
                errors[name] = ["Must be zero or greater."]
        for name in ("progress_percentage", "pass_percentage"):
            value = getattr(candidate, name, None)
            if value is not None and not 0 <= value <= 100:
                errors[name] = ["Must be between 0 and 100."]
        if model._meta.label_lower == "accounts.user" and self.instance:
            actor = self.context["request"].user
            if self.instance.is_superuser and any(attrs.get(name, getattr(self.instance, name)) != getattr(self.instance, name) for name in ("role", "is_active")):
                errors["role"] = ["Superuser access must be managed in the backend admin."]
            if actor.pk == self.instance.pk and (attrs.get("is_active") is False or attrs.get("role", actor.role) != actor.role):
                errors["role"] = ["You cannot deactivate or change your own administrator role."]
        # Preserve model constraints, field validators and uniqueness on PATCH too.
        try:
            candidate.full_clean(exclude=[field.name for field in model._meta.many_to_many])
        except DjangoValidationError as exc:
            errors.update(exc.message_dict if hasattr(exc, "message_dict") else {"non_field_errors": exc.messages})
        if errors:
            raise ValidationError(errors)
        return attrs

    def create(self, validated_data):
        if self.Meta.model._meta.label_lower == "accounts.user":
            password = validated_data.pop("initial_password")
            return self.Meta.model.objects.create_user(password=password, **validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        previous_partner = instance.donor_organization if instance._meta.label_lower == "donors.grant" else None
        updated = super().update(instance, validated_data)
        if previous_partner and previous_partner.pk != updated.donor_organization_id:
            previous_partner.recalculate_totals()
        return updated


def label_for(obj):
    if obj._meta.label_lower == "accounts.user":
        return obj.get_full_name() or "Unnamed account"
    return str(obj)[:250]


def record_data(resource, obj, request):
    data = serializer_for(resource)(obj, context={"request": request}).data
    data["_label"] = label_for(obj)
    data["_relations"] = {}
    for field in visible_fields(resource):
        if field.is_relation and not field.many_to_many:
            related = getattr(obj, field.name, None)
            if related:
                data["_relations"][field.name] = label_for(related)
    return data


def field_metadata(resource, field, serialized):
    kind = "text"
    if field.is_relation:
        kind = "relation"
    elif field.choices:
        kind = "choice"
    elif isinstance(field, models.BooleanField):
        kind = "boolean"
    elif isinstance(field, models.DateTimeField):
        kind = "datetime"
    elif isinstance(field, models.DateField):
        kind = "date"
    elif isinstance(field, models.ImageField):
        kind = "image"
    elif isinstance(field, models.FileField):
        kind = "file"
    elif isinstance(field, models.JSONField):
        kind = "json"
    elif isinstance(field, (models.IntegerField, models.DecimalField, models.FloatField)):
        kind = "number"
    elif isinstance(field, models.TextField):
        kind = "richtext" if field.get_internal_type() == "CKEditor5Field" or field.__class__.__name__ == "CKEditor5Field" else "textarea"
    elif isinstance(field, models.EmailField):
        kind = "email"
    elif isinstance(field, models.URLField):
        kind = "url"
    default = field.get_default() if field.has_default() else None
    if not isinstance(default, (str, int, float, bool, list, dict, type(None))):
        default = str(default)
    return {
        "name": field.name, "label": str(field.verbose_name).replace('_', ' ').capitalize(),
        "type": kind, "required": serialized.required, "readonly": serialized.read_only,
        "nullable": field.null, "multiple": field.many_to_many,
        "help": str(field.help_text), "default": default,
        "max_length": getattr(field, "max_length", None),
        "step": str(Decimal(1).scaleb(-field.decimal_places)) if isinstance(field, models.DecimalField) else "1",
        "choices": [{"value": value, "label": str(label)} for value, label in field.flatchoices] if field.choices else [],
    }


def catalog_entry(key, resource, user, detail=False):
    can_archive = resource.archive and is_admin(user) and hasattr(model_for(resource), "soft_delete")
    can_write = is_admin(user) or resource.model not in ADMIN_WRITE_MODELS
    entry = {"key": key, "title": resource.title, "singular": str(model_for(resource)._meta.verbose_name), "group": resource.group, "columns": resource.columns,
             "permissions": {"create": resource.create and can_write, "edit": resource.edit and can_write, "archive": can_archive}}
    if key == "payment-settings":
        entry["permissions"]["create"] = not model_for(resource).all_objects.exists()
    if detail:
        serializer_fields = serializer_for(resource)().fields
        entry["fields"] = [field_metadata(resource, field, serializer_fields[field.name]) for field in visible_fields(resource)]
        if not can_write:
            for field in entry["fields"]:
                field["readonly"] = True
        if key == "users":
            entry["fields"].append({"name": "initial_password", "label": "Initial password", "type": "password",
                                     "required": True, "readonly": False, "nullable": False, "multiple": False,
                                     "help": "Used only when creating an account. Existing credentials are never shown.",
                                     "default": "", "max_length": 128, "step": "1", "choices": [], "create_only": True})
    return entry


def audit(request, obj, action, message):
    LogEntry.objects.create(user=request.user, content_type=ContentType.objects.get_for_model(obj),
                            object_id=str(obj.pk), object_repr=label_for(obj)[:200], action_flag=action,
                            change_message=message)


class WorkspaceView(APIView):
    permission_classes = [WorkspacePermission]

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "no-store"
        return response


class CatalogView(WorkspaceView):
    def get(self, request):
        return Response([catalog_entry(key, resource, request.user) for key, resource in CATALOG.items()
                         if not resource.admin_only or is_admin(request.user)])


class SchemaView(WorkspaceView):
    def get(self, request, resource):
        config = resource_for(resource, request.user)
        return Response(catalog_entry(resource, config, request.user, detail=True))


def filtered_queryset(resource, request, include_archived=False):
    model = model_for(resource)
    manager = model.all_objects if include_archived and hasattr(model, "all_objects") else model.objects
    qs = manager.all()
    fields = visible_fields(resource)
    relations = [field.name for field in fields if field.is_relation and not field.many_to_many]
    many = [field.name for field in fields if field.many_to_many]
    if relations:
        qs = qs.select_related(*relations)
    if many:
        qs = qs.prefetch_related(*many)
    search = request.query_params.get("search", "").strip()[:200]
    if search:
        clause = Q()
        for field in fields:
            if isinstance(field, (models.CharField, models.TextField)):
                clause |= Q(**{f"{field.name}__icontains": search})
        qs = qs.filter(clause)
    for field in fields:
        value = request.query_params.get(field.name)
        if value is not None and (field.choices or isinstance(field, models.BooleanField)):
            if isinstance(field, models.BooleanField):
                if value not in ("true", "false"):
                    raise ValidationError({field.name: "Use true or false."})
                value = value == "true"
            elif value not in {str(v) for v, _ in field.flatchoices}:
                raise ValidationError({field.name: "Invalid filter."})
            qs = qs.filter(**{field.name: value})
    ordering = request.query_params.get("ordering", "-created_at")
    allowed = {"created_at", "updated_at", *[field.name for field in fields if field.concrete and not field.is_relation and not isinstance(field, (models.FileField, models.JSONField, models.TextField))]}
    if ordering.lstrip("-") not in allowed:
        raise ValidationError({"ordering": "Invalid sort field."})
    if include_archived:
        qs = qs.filter(deleted_at__isnull=False)
    return qs.order_by(ordering, "pk")


class RecordsView(WorkspaceView):
    def get(self, request, resource):
        config = resource_for(resource, request.user)
        archived = request.query_params.get("archived") == "true"
        if archived and not catalog_entry(resource, config, request.user)["permissions"]["archive"]:
            raise PermissionDenied("Archive access requires an administrator.")
        qs = filtered_queryset(config, request, archived)
        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        return paginator.get_paginated_response([record_data(config, obj, request) for obj in page])

    def post(self, request, resource):
        config = resource_for(resource, request.user)
        if not catalog_entry(resource, config, request.user)["permissions"]["create"]:
            raise PermissionDenied("Creation is unavailable for this section.")
        serializer = serializer_for(config)(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                obj = serializer.save()
                audit(request, obj, ADDITION, "Created from frontend admin")
        except IntegrityError:
            raise ValidationError({"non_field_errors": ["A conflicting record already exists. Refresh and try again."]})
        return Response(record_data(config, obj, request), status=201)


class RecordView(WorkspaceView):
    def get(self, request, resource, pk):
        config = resource_for(resource, request.user)
        archived = request.query_params.get("archived") == "true"
        if archived and not catalog_entry(resource, config, request.user)["permissions"]["archive"]:
            raise PermissionDenied("Archive access requires an administrator.")
        manager = model_for(config).all_objects if archived else model_for(config).objects
        return Response(record_data(config, get_object_or_404(manager, pk=pk), request))

    def patch(self, request, resource, pk):
        config = resource_for(resource, request.user)
        if not catalog_entry(resource, config, request.user)["permissions"]["edit"]:
            raise PermissionDenied("This section is read-only.")
        try:
            with transaction.atomic():
                obj = get_object_or_404(model_for(config).objects.select_for_update(), pk=pk)
                serializer = serializer_for(config)(obj, data=request.data, partial=True, context={"request": request})
                serializer.is_valid(raise_exception=True)
                obj = serializer.save()
                audit(request, obj, CHANGE, "Updated fields: " + ", ".join(serializer.validated_data))
        except IntegrityError:
            raise ValidationError({"non_field_errors": ["A conflicting record already exists. Refresh and try again."]})
        return Response(record_data(config, obj, request))


class ArchiveView(WorkspaceView):
    def post(self, request, resource, pk):
        config = resource_for(resource, request.user)
        if not catalog_entry(resource, config, request.user)["permissions"]["archive"]:
            raise PermissionDenied("Archiving requires an administrator.")
        restore = request.data.get("restore") is True
        with transaction.atomic():
            obj = get_object_or_404(model_for(config).all_objects.select_for_update(), pk=pk)
            if restore:
                for field in obj._meta.fields:
                    if field.is_relation:
                        parent = getattr(obj, field.name, None)
                        if parent and getattr(parent, "deleted_at", None):
                            raise ValidationError({"detail": f"Restore the related {field.verbose_name} first."})
                obj.restore()
            else:
                for relation in obj._meta.related_objects:
                    if not relation.one_to_many and not relation.one_to_one:
                        continue
                    if relation.on_delete not in (models.CASCADE, models.PROTECT):
                        continue
                    children = relation.related_model._default_manager.filter(**{relation.field.name: obj})
                    if children.exists():
                        raise ValidationError({"detail": f"Archive the related {relation.related_model._meta.verbose_name_plural} first. This record still has active dependents."})
                obj.soft_delete()
            audit(request, obj, CHANGE, "Restored from archive" if restore else "Archived from frontend admin")
        return Response({"detail": "Record restored." if restore else "Record archived."})


class OptionsView(WorkspaceView):
    def get(self, request, resource, field):
        config = resource_for(resource, request.user)
        relation = next((item for item in visible_fields(config) if item.name == field and item.is_relation), None)
        if relation is None:
            raise ValidationError({"field": "Unknown relationship."})
        model = relation.related_model
        qs = model.objects.all()
        search = request.query_params.get("search", "").strip()[:200]
        if search:
            clause = Q()
            for name in ("title", "name", "first_name", "last_name", "email", "text"):
                if any(item.name == name for item in model._meta.fields):
                    clause |= Q(**{f"{name}__icontains": search})
            qs = qs.filter(clause)
        selected = request.query_params.getlist("selected")
        if selected:
            try:
                selected = [model._meta.pk.to_python(value) for value in selected[:100]]
            except (DjangoValidationError, ValueError):
                raise ValidationError({"selected": "Invalid record identifier."})
            qs = model.objects.filter(Q(pk__in=selected) | Q(pk__in=qs.values("pk")))
        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs.order_by("pk"), request, view=self)
        return paginator.get_paginated_response([{"value": str(obj.pk), "label": label_for(obj)} for obj in page])


class OverviewView(WorkspaceView):
    def get(self, request):
        today = timezone.localdate()
        start = today - timedelta(days=29)
        donation = model_for(CATALOG["donations"])
        completed = donation.objects.filter(status="completed", created_at__date__range=(start, today))
        totals = list(completed.values("currency").annotate(amount=Sum("amount"), count=Count("id")).order_by("currency"))
        daily = list(completed.annotate(day=TruncDate("created_at")).values("day").annotate(count=Count("id")).order_by("day"))
        counts = {key: model_for(resource).objects.count() for key, resource in CATALOG.items() if not resource.admin_only or is_admin(request.user)}
        queues = []
        for key, field, value, label in (
            ("applications", "status", "pending", "Volunteer applications to review"),
            ("messages", "status", "new", "New contact messages"),
            ("comments", "is_approved", False, "Comments awaiting approval"),
            ("tasks", "status", "pending", "Volunteer tasks to assign or start"),
        ):
            queues.append({"key": key, "field": field, "value": str(value).lower(), "label": label,
                           "count": model_for(CATALOG[key]).objects.filter(**{field: value}).count()})
        article = apps.get_model("blogs.Article")
        queues.insert(0, {"key": "blog", "field": "status", "value": "review", "label": "Articles awaiting review", "count": article.objects.filter(status="review").count()})
        recent = list(LogEntry.objects.select_related("user").filter(user=request.user).order_by("-action_time").values("action_time", "object_repr", "change_message")[:8])
        return Response({"period_start": start, "period_end": today, "counts": counts,
                         "donation_totals": totals, "daily_donations": daily, "queues": queues, "recent_activity": recent})


urlpatterns = [
    path("catalog/", CatalogView.as_view()),
    path("overview/", OverviewView.as_view()),
    path("<slug:resource>/schema/", SchemaView.as_view()),
    path("<slug:resource>/options/<str:field>/", OptionsView.as_view()),
    path("<slug:resource>/<uuid:pk>/archive/", ArchiveView.as_view()),
    path("<slug:resource>/<uuid:pk>/", RecordView.as_view()),
    path("<slug:resource>/", RecordsView.as_view()),
]
