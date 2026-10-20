from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from django.utils.text import slugify


DONOR_DETAILS = {
    "act ubumbano.png": ("ACT Ubumbano", "", "ngo"),
    "allstars.png": ("Allstars Consultancy", "ALLSTARS", "corporation"),
    "becky logo.jpg": ("Bejema Health Care", "BEJEMA", "corporation"),
    "canadian logo.png": ("Government of Canada", "", "government"),
    "eu.jpg": ("European Union", "EU", "multilateral"),
    "every breath counts.png": ("Every Breath Counts Coalition", "EBC", "ngo"),
    "fondation merieux.jpeg": ("Fondation Merieux", "", "foundation"),
    "frontline aids.png": ("Frontline AIDS", "", "ngo"),
    "global fund.jpeg": ("The Global Fund", "", "multilateral"),
    "her voice fund.png": ("Her Voice Fund", "", "foundation"),
    "the braiding zone.jpg": ("The Braiding Zone", "", "other"),
    "unaids.jpeg": ("UNAIDS Cameroon", "UNAIDS", "multilateral"),
    "unfpa.jpeg": ("United Nations Population Fund", "UNFPA", "multilateral"),
    "viv healthcare.jpeg": ("ViiV Healthcare Positive Action", "ViiV", "corporation"),
    "wep.jpeg": ("Women Environmental Programme", "WEP", "ngo"),
    "women 2030.jpeg": ("Women 2030", "", "ngo"),
    "world pneumonia day.jpeg": ("World Pneumonia Day", "", "other"),
    "y+ global.jpeg": ("Y+ Global", "", "ngo"),
}

# Keep archived filename compatibility while accepting the converted public assets.
DONOR_DETAILS.update({str(Path(name).with_suffix(".webp")): details for name, details in list(DONOR_DETAILS.items())})


@dataclass(frozen=True)
class ArchivedDonor:
    name: str
    slug: str
    abbreviation: str
    donor_type: str
    logo_path: str

    def as_row(self) -> dict[str, str]:
        return self.__dict__.copy()


def scrape_donors(logo_directory: Path, project_root: Path) -> list[ArchivedDonor]:
    donors = []
    for logo in sorted(logo_directory.iterdir(), key=lambda item: item.name.lower()):
        if logo.suffix.lower() != ".webp" and logo.with_suffix(".webp").is_file():
            continue
        details = DONOR_DETAILS.get(logo.name.lower())
        if not logo.is_file() or details is None:
            continue
        name, abbreviation, donor_type = details
        donors.append(
            ArchivedDonor(
                name=name,
                slug=slugify(name),
                abbreviation=abbreviation,
                donor_type=donor_type,
                logo_path=logo.resolve().relative_to(project_root.resolve()).as_posix(),
            )
        )
    return donors
