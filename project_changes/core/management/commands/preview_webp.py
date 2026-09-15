"""
Convert a single local image to WebP and generate a side-by-side HTML
comparison, so you can eyeball quality before running the bulk backfill.

Usage:
    python manage.py preview_webp path/to/image.jpg
    python manage.py preview_webp path/to/image.jpg --quality 90
"""

from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError

from core.utils.images import to_webp


class Command(BaseCommand):
    help = "Convert one local image to WebP and open a before/after comparison."

    def add_arguments(self, parser):
        parser.add_argument("image_path")
        parser.add_argument("--quality", type=int, default=82)
        parser.add_argument("--out-dir", default="webp_preview")

    def handle(self, *args, **options):
        source = Path(options["image_path"])
        if not source.exists():
            raise CommandError(f"No such file: {source}")

        out_dir = Path(options["out_dir"])
        out_dir.mkdir(parents=True, exist_ok=True)

        with source.open("rb") as fh:
            django_file = File(fh, name=source.name)
            result = to_webp(django_file, quality=options["quality"])

        if result is None:
            raise CommandError("Not a jpg/jpeg/png file, nothing to convert.")

        content, new_name = result
        webp_path = out_dir / new_name
        webp_path.write_bytes(content.read())

        original_copy = out_dir / source.name
        original_copy.write_bytes(source.read_bytes())

        original_kb = source.stat().st_size / 1024
        webp_kb = webp_path.stat().st_size / 1024
        reduction = 100 * (1 - webp_kb / original_kb)

        html_path = out_dir / "compare.html"
        html_path.write_text(
            f"""<!doctype html>
<html><head><meta charset="utf-8"><title>WebP comparison</title>
<style>
  body {{ font-family: sans-serif; background: #111; color: #eee; margin: 0; padding: 2rem; }}
  .row {{ display: flex; gap: 2rem; }}
  figure {{ flex: 1; margin: 0; text-align: center; }}
  img {{ max-width: 100%; height: auto; border: 1px solid #333; }}
  figcaption {{ margin-top: .5rem; font-size: .9rem; color: #aaa; }}
</style></head>
<body>
  <h1>WebP quality comparison</h1>
  <p>Original: {original_kb:.0f} KB &nbsp;&rarr;&nbsp; WebP: {webp_kb:.0f} KB
     ({reduction:.0f}% smaller, quality={options['quality']})</p>
  <div class="row">
    <figure>
      <img src="{source.name}" alt="original">
      <figcaption>Original ({source.suffix.lstrip('.').upper()})</figcaption>
    </figure>
    <figure>
      <img src="{new_name}" alt="webp">
      <figcaption>WebP</figcaption>
    </figure>
  </div>
</body></html>""",
            encoding="utf-8",
        )

        self.stdout.write(self.style.SUCCESS(f"Open {html_path} in a browser to compare."))
        self.stdout.write(f"{original_kb:.0f} KB -> {webp_kb:.0f} KB ({reduction:.0f}% smaller)")
