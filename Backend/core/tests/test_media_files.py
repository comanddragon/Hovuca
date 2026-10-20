import uuid
from io import BytesIO

from django.test import SimpleTestCase
from PIL import Image

from core.utils.files import parent_named_upload_path
from core.utils.images import to_webp


class ExampleMeta:
    model_name = "example"


class ExampleObject:
    _meta = ExampleMeta()
    pk = uuid.UUID("12345678-1234-5678-1234-567812345678")
    slug = "A Parent Object"


class MediaFileTests(SimpleTestCase):
    def test_parent_named_upload_path_is_readable_and_stable(self):
        upload_to = parent_named_upload_path("examples/covers", "cover")

        result = upload_to(ExampleObject(), "unsafe original NAME.PNG")

        self.assertEqual(
            result,
            "examples/covers/a-parent-object-cover-12345678.png",
        )

    def test_webp_input_is_not_reconverted(self):
        image_buffer = BytesIO()
        Image.new("RGB", (2, 2), "white").save(image_buffer, format="WEBP")
        image_buffer.name = "already-converted.WeBp"
        image_buffer.seek(0)

        self.assertIsNone(to_webp(image_buffer))

    def test_parent_named_path_fits_default_filefield_limit(self):
        upload_to = parent_named_upload_path("resources/documents", "document")
        instance = ExampleObject()
        instance.slug = "a-very-long-parent-name-" * 10

        result = upload_to(instance, "document.pdf")

        self.assertLessEqual(len(result), 100)
        self.assertTrue(result.endswith("-document-12345678.pdf"))
