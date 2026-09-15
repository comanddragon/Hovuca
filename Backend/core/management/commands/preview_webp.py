"""
Convert local jpg/jpeg/png images to WebP, writing each .webp file next to
its source, and generate a side-by-side HTML comparison so you can eyeball
quality before running the bulk backfill.

Usage:
    python manage.py preview_webp path/to/image.jpg
    python manage.py preview_webp path/to/folder
    python manage.py preview_webp path/to/folder --quality 90
"""

from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError

from core.utils.images import to_webp

CONVERTIBLE_SUFFIXES = {".jpg", ".jpeg", ".png"}


class Command(BaseCommand):
    help = "Convert local images to WebP next to their source and open a before/after comparison."

    def add_arguments(self, parser):
        parser.add_argument("image_path")
        parser.add_argument("--quality", type=int, default=82)
        parser.add_argument("--report-dir", default="webp_preview")

    def handle(self, *args, **options):
        target = Path(options["image_path"])
        if not target.exists():
            raise CommandError(f"No such path: {target}")

        if target.is_dir():
            sources = sorted(
                p for p in target.rglob("*") if p.suffix.lower() in CONVERTIBLE_SUFFIXES
            )
            if not sources:
                raise CommandError(f"No jpg/jpeg/png files found under {target}")
        else:
            sources = [target]

        report_dir = Path(options["report_dir"])
        report_dir.mkdir(parents=True, exist_ok=True)

        rows = []
        total_original = total_webp = 0

        for source in sources:
            with source.open("rb") as fh:
                django_file = File(fh, name=source.name)
                result = to_webp(django_file, quality=options["quality"])

            if result is None:
                self.stderr.write(f"Skipped (not jpg/jpeg/png): {source}")
                continue

            content, new_name = result
            webp_path = source.with_name(new_name)
            webp_path.write_bytes(content.read())

            original_kb = source.stat().st_size / 1024
            webp_kb = webp_path.stat().st_size / 1024
            reduction = 100 * (1 - webp_kb / original_kb) if original_kb else 0
            total_original += original_kb
            total_webp += webp_kb

            label = source.relative_to(target) if target.is_dir() else source.name
            self.stdout.write(
                f"{label}: {original_kb:.0f} KB -> {webp_kb:.0f} KB ({reduction:.0f}% smaller)"
                f"  [{webp_path}]"
            )
            rows.append(
                f"""<section class="row">
    <h2>{label}</h2>
    <p>{original_kb:.0f} KB &rarr; {webp_kb:.0f} KB ({reduction:.0f}% smaller)</p>
    <div class="images">
      <figure>
        <img src="{source.resolve().as_uri()}" alt="original">
        <figcaption>Original ({source.suffix.lstrip('.').upper()})</figcaption>
      </figure>
      <figure>
        <img src="{webp_path.resolve().as_uri()}" alt="webp">
        <figcaption>WebP</figcaption>
      </figure>
    </div>
  </section>"""
            )

        if not rows:
            raise CommandError("Nothing converted.")

        total_reduction = 100 * (1 - total_webp / total_original) if total_original else 0
        html_path = report_dir / "compare.html"
        html_path.write_text(
            f"""<!doctype html>
<html><head><meta charset="utf-8"><title>WebP comparison</title>
<style>
  body {{ font-family: sans-serif; background: #111; color: #eee; margin: 0; padding: 2rem; }}
  .row {{ border-bottom: 1px solid #333; padding-bottom: 1.5rem; margin-bottom: 1.5rem; }}
  .images {{ display: flex; gap: 2rem; }}
  figure {{ flex: 1; margin: 0; text-align: center; }}
  img {{ max-width: 100%; height: auto; border: 1px solid #333; }}
  figcaption {{ margin-top: .5rem; font-size: .9rem; color: #aaa; }}
  h1 {{ margin-bottom: 0; }}
  h2 {{ font-size: 1rem; font-weight: normal; color: #ccc; }}
</style></head>
<body>
  <h1>WebP quality comparison</h1>
  <p>{len(rows)} image(s), quality={options['quality']}. Total: {total_original:.0f} KB
     &rarr; {total_webp:.0f} KB ({total_reduction:.0f}% smaller)</p>
  {''.join(rows)}
</body></html>""",
            encoding="utf-8",
        )

        self.stdout.write(self.style.SUCCESS(f"\nOpen {html_path} in a browser to compare."))
        self.stdout.write(
            f"Total: {total_original:.0f} KB -> {total_webp:.0f} KB ({total_reduction:.0f}% smaller)"
        )