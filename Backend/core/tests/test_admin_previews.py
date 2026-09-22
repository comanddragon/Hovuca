from django.test import SimpleTestCase

from core.admin import document_preview, image_preview, video_preview


class FileReference:
    def __init__(self, url):
        self.url = url


class AdminPreviewTests(SimpleTestCase):
    def test_image_preview_links_to_the_original_asset(self):
        preview = image_preview(FileReference("https://media.example.org/image.webp"))

        self.assertIn('src="https://media.example.org/image.webp"', preview)
        self.assertIn('target="_blank"', preview)
        self.assertIn("max-width:140px", preview)

    def test_pdf_preview_embeds_and_links_to_the_document(self):
        preview = document_preview(FileReference("https://media.example.org/report.pdf"))

        self.assertIn("<iframe", preview)
        self.assertIn("report.pdf", preview)
        self.assertIn("height:280px", preview)

    def test_youtube_url_uses_privacy_enhanced_embed(self):
        preview = video_preview("https://www.youtube.com/watch?v=abc123")

        self.assertIn("youtube-nocookie.com/embed/abc123", preview)
