from django_ckeditor_5.widgets import CKEditor5Widget


class AdminCKEditor5Widget(CKEditor5Widget):
    """CKEditor widget with an Unfold-safe late initialization pass."""

    class Media:
        css = {"all": ["admin/ckeditor.css"]}  # Optional: add custom styles only if needed
        js = ["admin/ckeditor-init.js"]  # Keep your Unfold compatibility script

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Inherit parent Media by extending it
        self.Media.css = {
            **CKEditor5Widget.Media.css,
            "all": (list(CKEditor5Widget.Media.css.get("all", [])) or []) + (self.Media.css.get("all") or [])
        }
        self.Media.js = list(CKEditor5Widget.Media.js) + list(self.Media.js)
