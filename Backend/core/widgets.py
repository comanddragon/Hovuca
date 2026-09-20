from django_ckeditor_5.widgets import CKEditor5Widget


class AdminCKEditor5Widget(CKEditor5Widget):
    """Use the configured CKEditor widget in Django's Unfold admin.

    The package owns its JavaScript initialisation.  Keeping this subclass
    intentionally small avoids replaying DOMContentLoaded (which can race the
    editor bundle). The native fullscreen enhancement is loaded only after the
    package's own editor bundle.
    """

    class Media:
        js = ["admin/ckeditor-fullscreen.js"]
