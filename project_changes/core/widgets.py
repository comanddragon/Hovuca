from django_ckeditor_5.widgets import CKEditor5Widget
from django.forms.widgets import Media as DjangoMedia


class AdminCKEditor5Widget(CKEditor5Widget):
    """CKEditor widget with proper Media merging for Unfold compatibility."""

    class Media:
        css = {"all": ["admin/ckeditor.css"]}
        js = ["admin/ckeditor-init.js"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    @property
    def media(self):
        """Dynamically merge parent CKEditor5Widget media with custom overrides."""
        # Get parent widget media
        parent_media = super().media
        
        # Create new merged Media object
        merged = DjangoMedia()
        
        # Add parent CSS
        for media_type, files in parent_media._css.items():
            for css_file in files:
                merged.add_css(media_type, css_file)
        
        # Add custom CSS
        for media_type, files in self.Media.css.items():
            for css_file in files:
                merged.add_css(media_type, css_file)
        
        # Add parent JS
        for js_file in parent_media._js:
            merged.add_js(js_file)
        
        # Add custom JS
        for js_file in self.Media.js:
            merged.add_js(js_file)
        
        return merged
