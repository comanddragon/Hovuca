from __future__ import annotations

import json
import re
import hashlib
from html import escape
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import unquote, urlsplit

from django.utils.text import slugify
from lxml import etree, html


ARCHIVE_PREFIX = "archive://"

TOPIC_ALIASES = {
    "adolescent-girls": ["health-nutrition", "adolescent-srhr-menstrual-hygiene-management"],
    "advocacy": ["childs-rights-advocacy"],
    "child-rights-advocacy": ["childs-rights-advocacy"],
    "education": ["education"],
    "hiv": ["health-nutrition"],
    "humanitarian-work": ["humanitarian-work"],
    "menstrual-hygiene": ["health-nutrition", "adolescent-srhr-menstrual-hygiene-management"],
    "non-formal-education": ["education"],
    "sexual-and-reproductive-health-agyw-voices": ["health-nutrition"],
}

TOPIC_KEYWORDS = {
    "health-nutrition": ("hiv", "aids", "menstrual", "sexual", "reproductive", "srhr", "abortion", "antiretroviral", "health"),
    "strong-girls-corner": ("girl", "woman", "women", "gender", "agyw"),
    "childs-rights-advocacy": ("child right", "children's right", "children’s right", "children", "advocacy"),
    "education": ("education", "school", "training", "skills", "curriculum"),
    "humanitarian-work": ("humanitarian", "displaced", "refugee", "emergency relief"),
    "livelihoods": ("livelihood", "income generating", "business support", "farming"),
}


def _class_xpath(class_name: str) -> str:
    return (
        './/*[contains(concat(" ", normalize-space(@class), " "), '
        f'" {class_name} ")]'
    )


def _text(element) -> str:
    return " ".join(element.text_content().split()) if element is not None else ""


def _first(element, xpath: str):
    matches = element.xpath(xpath)
    return matches[0] if matches else None


def _archive_root(path: Path) -> Path:
    return next(
        (parent for parent in path.parents if parent.name.lower() == "hovuca.org"),
        path.parents[1],
    )


def _archive_path(raw_url: str, page_path: Path, archive_root: Path) -> str:
    """Convert a local mirror URL into a portable archive-relative path."""
    parsed = urlsplit(raw_url)
    path = unquote(parsed.path)
    if not path or (parsed.netloc and parsed.netloc.lower() not in {"hovuca.org", "www.hovuca.org"}):
        return ""
    resolved = (
        archive_root / path.lstrip("/")
        if parsed.netloc or path.startswith("/")
        else page_path.parent / path
    ).resolve()
    try:
        relative = resolved.relative_to(archive_root.resolve())
    except ValueError:
        return ""
    return relative.as_posix()


def _portable_images(element, page_path: Path, archive_root: Path) -> None:
    for image in element.xpath(".//img[@src]"):
        relative = _archive_path(image.get("src", ""), page_path, archive_root)
        if relative:
            image.set("src", f"{ARCHIVE_PREFIX}{relative}")
        for attribute in ("srcset", "sizes", "loading", "decoding"):
            image.attrib.pop(attribute, None)


BLOCK_TAGS = {"p", "ul", "ol", "table", "figure", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"}


def _normalize_body_html(element) -> str:
    """
    Serialize `element`'s children into proper block-level HTML.

    The archived markup often has no real paragraphs: lines are just
    text nodes separated by <br>, all as siblings/tail-text inside one
    wrapper. tostring()-ing each child alone drops that tail text and
    leaves everything else glued into a single block. Here, each run of
    text terminated by a <br> becomes its own <p>, existing block tags
    (p, ul, table, headings, ...) are kept as-is, and <div> wrappers are
    recursed into so their loose content gets the same treatment.
    """
    parts = []
    buffer = []

    def flush_buffer():
        text = "".join(buffer).strip()
        buffer.clear()
        if text:
            parts.append(f"<p>{text}</p>")

    def add_text(text):
        if text and text.strip():
            buffer.append(escape(text))

    add_text(element.text)

    for child in element:
        tag = child.tag.lower() if isinstance(child.tag, str) else ""
        if tag == "br":
            flush_buffer()
        elif tag in BLOCK_TAGS:
            flush_buffer()
            parts.append(etree.tostring(child, encoding="unicode", method="html", with_tail=False))
        elif tag == "div":
            flush_buffer()
            nested = _normalize_body_html(child)
            if nested:
                parts.append(nested)
        else:
            buffer.append(etree.tostring(child, encoding="unicode", method="html", with_tail=False))
        add_text(child.tail)

    flush_buffer()
    return "\n".join(parts)


@dataclass(frozen=True)
class ArchivedArticle:
    source_id: str
    title: str
    slug: str
    excerpt: str
    body_html: str
    category: str
    tags: str
    topic_slugs: str
    published_at: str
    updated_at: str
    cover_image_path: str
    cover_image_alt: str
    source_url: str

    def as_row(self) -> dict[str, str]:
        return self.__dict__.copy()


@dataclass(frozen=True)
class ArchivedResource:
    title: str
    slug: str
    description: str
    category: str
    file_path: str
    published_at: str
    source_url: str

    def as_row(self) -> dict[str, str]:
        return self.__dict__.copy()


def scrape_resources(index_path: Path) -> list[ArchivedResource]:
    index_path = index_path.resolve()
    archive_root = _archive_root(index_path)
    document = html.fromstring(index_path.read_bytes())
    content = _first(document, _class_xpath("entry-content"))
    if content is None:
        content = document

    resources_by_path: dict[str, ArchivedResource] = {}
    for link in content.xpath('.//a[@href]'):
        relative = _archive_path(link.get("href", ""), index_path, archive_root)
        if not relative or Path(relative).suffix.lower() not in {".pdf", ".doc", ".docx", ".xls", ".xlsx"}:
            continue
        file_path = archive_root / relative
        if not file_path.is_file():
            continue
        title = _text(link).replace("�", "–")
        title = re.sub(r"^download\s+", "", title, flags=re.I)
        title = re.sub(r"\s*@\s*HOVUCA\s*$", "", title, flags=re.I)
        if not title:
            image = _first(link, ".//img")
            title = image.get("alt", "").strip() if image is not None else ""
        if not title:
            title = file_path.stem.replace("-", " ").strip()
        parent_text = _text(link.getparent()) if link.getparent() is not None else ""
        description = parent_text if parent_text and parent_text != title else ""
        candidate = ArchivedResource(
            title=title,
            slug=slugify(title)[:280],
            description=description,
            category="Document",
            file_path=relative,
            published_at="",
            source_url=link.get("href", ""),
        )
        existing = resources_by_path.get(relative)
        generic_titles = {"download", "click here", "view", "read more"}
        if existing is None or (
                existing.title.lower() in generic_titles and candidate.title.lower() not in generic_titles
        ):
            resources_by_path[relative] = candidate

    resources_by_digest: dict[str, ArchivedResource] = {}
    for resource in resources_by_path.values():
        digest = hashlib.sha256((archive_root / resource.file_path).read_bytes()).hexdigest()
        resources_by_digest.setdefault(digest, resource)
    return list(resources_by_digest.values())

UPLOAD_CATEGORIES = {
    "Image": {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico"},
    "Video": {".mp4", ".mov", ".avi", ".webm", ".mkv", ".m4v"},
    "Document": {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv"},
}


def _category_for_suffix(suffix: str) -> str:
    suffix = suffix.lower()
    for category, extensions in UPLOAD_CATEGORIES.items():
        if suffix in extensions:
            return category
    return "Other"


def scrape_uploads(archive_root: Path) -> list[ArchivedResource]:
    uploads_root = archive_root / "wp-content" / "uploads"
    if not uploads_root.is_dir():
        return []
    resources = []
    for file_path in sorted(uploads_root.rglob("*")):
        if not file_path.is_file():
            continue
        relative = file_path.relative_to(archive_root).as_posix()
        title = file_path.stem.replace("-", " ").replace("_", " ").strip()
        resources.append(
            ArchivedResource(
                title=title,
                slug=slugify(title)[:280],
                description="",
                category=_category_for_suffix(file_path.suffix),
                file_path=relative,
                published_at="",
                source_url=f"https://hovuca.org/{relative}",
            )
        )
    return resources

def scrape_archive(index_path: Path) -> list[ArchivedArticle]:
    index_path = index_path.resolve()
    archive_root = _archive_root(index_path)
    document = html.fromstring(index_path.read_bytes())
    cards = document.xpath('//article[contains(concat(" ", normalize-space(@class), " "), " type-post ")]')
    articles: list[ArchivedArticle] = []

    for card in cards:
        title_link = _first(card, f'{_class_xpath("entry-title")}//a[@href]')
        if title_link is None:
            continue
        source_url = title_link.get("href", "")
        article_path_raw = _archive_path(source_url, index_path, archive_root)
        article_path = archive_root / article_path_raw
        if not article_path.is_file():
            continue

        detail = html.fromstring(article_path.read_bytes())
        post = _first(detail, '//article[contains(concat(" ", normalize-space(@class), " "), " type-post ")]')
        if post is None:
            continue

        title_node = _first(post, _class_xpath("entry-title"))
        title = _text(title_node) or _text(title_link)
        slug = slugify(article_path.parent.name or title)
        body = _first(post, _class_xpath("entry-content"))
        if body is None:
            continue
        for unwanted in body.xpath(".//script|.//style|.//noscript|.//form"):
            unwanted.getparent().remove(unwanted)
        _portable_images(body, article_path, archive_root)
        body_html = _normalize_body_html(body)
        body_text = _text(body)

        card_excerpt_node = _first(card, _class_xpath("entry-content"))
        excerpt = _text(card_excerpt_node) or body_text
        excerpt = re.sub(r"\s*(read more|continue reading).*?$", "", excerpt, flags=re.I).strip()[:500]
        if not body_html and excerpt:
            body_html = f"<p>{escape(excerpt)}</p>"

        category_nodes = post.xpath(
            f'{_class_xpath("category")}//a | {_class_xpath("cat-links")}//a'
        )
        categories = list(dict.fromkeys(filter(None, (_text(node) for node in category_nodes))))
        topic_slugs = list(dict.fromkeys(
            topic_slug
            for category_name in categories
            for topic_slug in TOPIC_ALIASES.get(slugify(category_name), [])
        ))
        searchable = f"{title} {body_text} {' '.join(categories)}".lower()
        topic_slugs.extend(
            topic_slug
            for topic_slug, keywords in TOPIC_KEYWORDS.items()
            if topic_slug not in topic_slugs and any(keyword in searchable for keyword in keywords)
        )

        published = _first(post, './/time[@itemprop="datePublished"]')
        updated = _first(post, './/time[@itemprop="dateModified"]')
        if published is None:
            published = _first(post, './/time[@datetime]')

        cover = _first(post, './/figure[contains(@class, "post-thumbnail")]//img[@src]')
        cover_path = _archive_path(cover.get("src", ""), article_path, archive_root) if cover is not None else ""
        source_id = (post.get("id") or card.get("id") or "").removeprefix("post-")

        articles.append(
            ArchivedArticle(
                source_id=source_id,
                title=title,
                slug=slug,
                excerpt=excerpt,
                body_html=body_html,
                category=categories[0] if categories else "News",
                tags=json.dumps(categories[1:], ensure_ascii=False),
                topic_slugs=json.dumps(topic_slugs, ensure_ascii=False),
                published_at=published.get("datetime", "") if published is not None else "",
                updated_at=updated.get("datetime", "") if updated is not None else "",
                cover_image_path=cover_path,
                cover_image_alt=(cover.get("alt", "").strip() if cover is not None else ""),
                source_url=source_url,
            )
        )

    return articles