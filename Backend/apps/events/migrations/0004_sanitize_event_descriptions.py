import bleach
from bleach.css_sanitizer import CSSSanitizer
from django.db import migrations

ALLOWED_TAGS = [
    "p", "br", "hr", "h1", "h2", "h3", "h4", "strong", "em", "u", "s",
    "ul", "ol", "li", "blockquote", "a", "code", "pre", "figure",
    "figcaption", "table", "thead", "tbody", "tfoot", "tr", "th", "td",
]
ALLOWED_ATTRIBUTES = {
    "a": ["href", "title", "rel"],
    "td": ["colspan", "rowspan", "style"],
    "th": ["colspan", "rowspan", "style"],
    "*": ["class", "style"],
}
ALLOWED_STYLES = [
    "width", "height", "margin-left", "margin-right", "float",
    "background-color", "border-color", "text-align",
]


def sanitize_existing_descriptions(apps, schema_editor):
    Event = apps.get_model("events", "Event")
    css_sanitizer = CSSSanitizer(allowed_css_properties=ALLOWED_STYLES)
    for event in Event.objects.exclude(description="").iterator():
        cleaned = bleach.clean(
            event.description,
            tags=ALLOWED_TAGS,
            attributes=ALLOWED_ATTRIBUTES,
            css_sanitizer=css_sanitizer,
            strip=True,
        )
        if cleaned != event.description:
            Event.objects.filter(pk=event.pk).update(description=cleaned)


class Migration(migrations.Migration):
    dependencies = [("events", "0003_alter_eventcategory_slug")]

    operations = [
        migrations.RunPython(
            sanitize_existing_descriptions,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
