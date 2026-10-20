"""Audience helpers for age-appropriate learning content."""

from datetime import date

from django.db.models import Q, QuerySet


def age_from_date_of_birth(date_of_birth, *, today=None):
    """Return a whole-year age, or ``None`` when no birthday is available."""
    if not date_of_birth:
        return None

    today = today or date.today()
    return today.year - date_of_birth.year - (
        (today.month, today.day) < (date_of_birth.month, date_of_birth.day)
    )


def learner_age(user):
    """Return an authenticated viewer's age when their birthday is available."""
    if not getattr(user, "is_authenticated", False):
        return None
    return age_from_date_of_birth(getattr(user, "date_of_birth", None))


def modules_for_learner(queryset: QuerySet, user) -> QuerySet:
    """Return a learner's age band, preferring the older version at a boundary."""
    age = learner_age(user)
    if age is None:
        return queryset

    matching_modules = list(queryset.filter(age_min__lte=age).filter(
        Q(age_max__isnull=True) | Q(age_max__gte=age)
    ))

    # Courses can carry parallel versions of the same module for adjacent age
    # bands. A boundary such as 10–15 and 15+ matches both at 15; the version
    # that starts closest to the learner's age is the intended, older pathway.
    visible_modules = {}
    for module in matching_modules:
        key = (module.course_id, module.title.strip().casefold())
        current = visible_modules.get(key)
        if current is None or module.age_min > current.age_min:
            visible_modules[key] = module

    return queryset.filter(pk__in=[module.pk for module in visible_modules.values()])
