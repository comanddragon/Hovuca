"""
Image conversion helpers.
"""

import io

from django.core.files.base import ContentFile
from PIL import Image

CONVERTIBLE_EXTENSIONS = {"jpg", "jpeg", "png"}


def to_webp(file, quality: int = 82):
    """
    Convert a jpg/jpeg/png file to WebP.

    `file` must be a file-like object opened for reading (e.g. an
    UploadedFile, or a storage-backed File opened in 'rb' mode) with a
    `.name` attribute.

    Returns (ContentFile, new_name) or None if the file isn't jpg/jpeg/png.
    """
    name = getattr(file, "name", "") or ""
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext not in CONVERTIBLE_EXTENSIONS:
        return None

    file.seek(0)
    image = Image.open(file)
    has_alpha = image.mode in ("RGBA", "LA") or (
        image.mode == "P" and "transparency" in image.info
    )
    image = image.convert("RGBA" if has_alpha else "RGB")

    buffer = io.BytesIO()
    image.save(buffer, format="WEBP", quality=quality)
    buffer.seek(0)

    new_name = name.rsplit(".", 1)[0] + ".webp"
    return ContentFile(buffer.read()), new_name
