from pathlib import Path
from tempfile import TemporaryDirectory

from django.test import SimpleTestCase

from apps.donors.importing import scrape_donors


class DonorWebpImportTests(SimpleTestCase):
    def test_webp_is_preferred_and_each_donor_is_exported_once(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            for name in ("ALLSTARS.png", "ALLSTARS.webp", "EU.jpg", "EU.webp"):
                (root / name).write_bytes(b"filename-only fixture")
            donors = scrape_donors(root, root)
            self.assertEqual(len(donors), 2)
            self.assertEqual({donor.logo_path for donor in donors}, {"ALLSTARS.webp", "EU.webp"})

    def test_archived_original_filenames_remain_supported(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "ALLSTARS.png").write_bytes(b"filename-only fixture")
            donors = scrape_donors(root, root)
            self.assertEqual(len(donors), 1)
            self.assertEqual(donors[0].logo_path, "ALLSTARS.png")
