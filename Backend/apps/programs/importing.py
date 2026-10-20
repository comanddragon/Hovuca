from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path

from django.utils.text import slugify
from lxml import html


def _clean_text(element) -> str:
    return " ".join(element.text_content().split()) if element is not None else ""


@dataclass(frozen=True)
class ArchivedTopic:
    name: str
    slug: str
    parent_slug: str
    description: str
    order: int
    depth: int
    source_url: str
    source_page: str

    def as_row(self):
        return asdict(self)


def scrape_topics(index_path: Path) -> list[ArchivedTopic]:
    index_path = index_path.resolve()
    archive_root = index_path.parents[1]
    document = html.fromstring(index_path.read_bytes())
    topic_links = document.xpath(
        '//ul[@id="primary-menu"]/li/a[normalize-space()="Topics"]'
    )
    if not topic_links:
        return []
    root_item = topic_links[0].getparent()
    root_lists = root_item.xpath('./ul[contains(concat(" ", normalize-space(@class), " "), " sub-menu ")]')
    if not root_lists:
        return []

    rows: list[ArchivedTopic] = []

    def visit(menu, parent_slug: str = "", depth: int = 0):
        for order, item in enumerate(menu.xpath("./li"), start=1):
            links = item.xpath("./a[@href]")
            if not links:
                continue
            link = links[0]
            name = _clean_text(link)
            source_url = link.get("href", "")
            slug = slugify(Path(source_url.rstrip("/")).parent.name or name)
            source_page = ""
            description = ""
            url_path = source_url.split("?", 1)[0]
            candidate = (index_path.parent / url_path).resolve()
            try:
                source_page = candidate.relative_to(archive_root).as_posix()
            except ValueError:
                candidate = Path()
            if candidate.is_file():
                page = html.fromstring(candidate.read_bytes())
                content = page.xpath(
                    '//*[contains(concat(" ", normalize-space(@class), " "), " entry-content ")][1]'
                )
                description = _clean_text(content[0]) if content else ""
            rows.append(ArchivedTopic(name, slug, parent_slug, description, order, depth, source_url, source_page))
            children = item.xpath('./ul[contains(concat(" ", normalize-space(@class), " "), " sub-menu ")]')
            if children:
                visit(children[0], slug, depth + 1)

    visit(root_lists[0])
    return rows
