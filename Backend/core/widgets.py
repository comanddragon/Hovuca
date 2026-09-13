from django_ckeditor_5.widgets import CKEditor5Widget


class AdminCKEditor5Widget(CKEditor5Widget):
    """CKEditor widget with an Unfold-safe late initialization pass."""

    class Media:
        css = {"all": ["django_ckeditor_5/dist/styles.css"]}
        js = [
            "django_ckeditor_5/dist/bundle.js",
            "admin/ckeditor-init.js",
        ]
