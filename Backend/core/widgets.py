from django_ckeditor_5.widgets import CKEditor5Widget


class AdminCKEditor5Widget(CKEditor5Widget):
    """CKEditor widget with an Unfold-safe late initialization pass."""

    class Media:
        css = {"all": ["admin/ckeditor.css"]}
        js = ["admin/ckeditor-init.js"]

    @property
    def media(self):
        """Return merged media from parent and custom overrides."""
        parent_media = super().media
        
        # Merge CSS
        css = {}
        for key in set(list(parent_media._css.keys()) + list(self.Media.css.keys())):
            css[key] = list(parent_media._css.get(key, [])) + list(self.Media.css.get(key, []))
        
        # Merge JS
        js = list(parent_media._js) + list(self.Media.js)
        
        # Create a new Media object with merged content
        from django.forms.widgets import Media as DjangoMedia
        merged = DjangoMedia()
        for key, files in css.items():
            for f in files:
                merged.add_css(key, f)
        for f in js:
            merged.add_js(f)
        
        return merged
