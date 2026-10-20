"""Repair semantic HTML in the archived blog and CSE seed CSVs.

This is deliberately conservative: it changes structure, not editorial claims.
Run after re-exporting either CSV to restore the reviewed formatting.
"""

from __future__ import annotations

import csv
import re
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from lxml import etree, html


ROOT = Path(__file__).resolve().parents[3]
BLOG_CSV = ROOT / "data" / "archived_blogs.csv"
CSE_CSV = ROOT / "data" / "cse_manual.csv"


def text(node: etree._Element) -> str:
    return " ".join(node.text_content().split())


def replace_tag(node: etree._Element, tag: str) -> None:
    node.tag = tag


def remove_empty_paragraphs(root: etree._Element) -> None:
    for node in root.xpath(".//p"):
        if not text(node) and not node.xpath(".//img|.//video|.//iframe"):
            node.drop_tree()


def group_marked_paragraphs(root: etree._Element, pattern: str, tag: str) -> None:
    """Turn consecutive paragraph points into a real list, retaining their text."""
    marker = re.compile(pattern, re.I)
    children = list(root)
    index = 0
    while index < len(children):
        node = children[index]
        if node.tag != "p" or not marker.match(text(node)):
            index += 1
            continue
        run = []
        while index < len(children) and children[index].tag == "p" and marker.match(text(children[index])):
            run.append(children[index])
            index += 1
        if len(run) < 2:
            continue
        listing = etree.Element(tag)
        root.insert(root.index(run[0]), listing)
        for paragraph in run:
            item = etree.SubElement(listing, "li")
            item.text = marker.sub("", text(paragraph), count=1).strip()
            root.remove(paragraph)
        children = list(root)
        index = children.index(listing) + 1


def group_paragraphs_after_heading(root: etree._Element, heading: str, count: int) -> None:
    for heading_node in root:
        if heading_node.tag not in {"h3", "h4", "p"} or text(heading_node).casefold() != heading.casefold():
            continue
        siblings = list(root)
        start = siblings.index(heading_node) + 1
        paragraphs = siblings[start:start + count]
        if len(paragraphs) != count or any(node.tag != "p" for node in paragraphs):
            return
        listing = etree.Element("ul")
        root.insert(start, listing)
        for paragraph in paragraphs:
            item = etree.SubElement(listing, "li")
            item.text = text(paragraph)
            root.remove(paragraph)
        return


def heading_paragraphs(root: etree._Element, headings: set[str], tag: str) -> None:
    for node in root:
        if node.tag == "p" and text(node).casefold() in headings:
            replace_tag(node, tag)


def serialize_blocks(root: etree._Element) -> str:
    for node in root:
        if node.tail is not None and not node.tail.strip():
            node.tail = None
    return "\n".join(html.tostring(node, encoding="unicode", method="html") for node in root)


def format_blog(row: dict[str, str]) -> str:
    root = html.fragment_fromstring(row["body_html"], create_parent="div")
    slug = row["slug"]
    remove_empty_paragraphs(root)

    if slug == "the-importance-of-antiretroviral-therapy":
        for node in list(root):
            if node.tag == "p" and text(node).startswith(("-It", "– It")):
                previous = node.getprevious()
                if previous is not None and previous.tag == "ul":
                    item = etree.SubElement(previous, "li")
                    item.text = re.sub(r"^[\s\-–]+", "", text(node))
                    root.remove(node)
    elif slug == "an-advocacy-against-menstrual-stigmatisation":
        heading_paragraphs(root, {"what is menstrual stigmatisation?"}, "h3")
        group_marked_paragraphs(root, r"^\s*\d+\s*\)\s*", "ol")
    elif slug == "the-intersection-of-gender-violence":
        for node in root:
            if node.tag == "h1":
                replace_tag(node, "h2")
            elif node.tag == "h4":
                replace_tag(node, "h3")
    elif slug == "parents-role-on-comprehensive-sexuality-education":
        group_marked_paragraphs(root, r"^\s*\d+\s*\.?\s*", "ol")
    elif slug == "risk-factors-that-expose-adolescent-girls-to-hiv":
        for node in root:
            if node.tag == "p" and re.match(r"^\d+\.\s*[A-Z]", text(node)) and len(text(node)) < 75:
                replace_tag(node, "h3")
    elif slug == "key-facts-about-sexual-and-reproductive-health-and-rights-srhr":
        headings = {text(node).casefold() for node in root if node.tag == "p" and text(node).isupper() and len(text(node)) < 130}
        heading_paragraphs(root, headings, "h3")
    elif slug == "i-am-not-a-thing-i-am-a-great-woman":
        paragraphs = [node for node in root if node.tag == "p"]
        if len(paragraphs) >= 7 and all(text(paragraphs[i]) == text(paragraphs[i + 3]) for i in range(1, 4)):
            for node in paragraphs[4:7]:
                root.remove(node)
        heading_paragraphs(root, {"why the story of mbu."}, "h3")
    elif slug == "speech-writing-competiton-first-winner-egbe-doris-takang":
        group_marked_paragraphs(root, r"^\s*[a-z]\)\s*", "ol")

    return serialize_blocks(root)


def format_cse(row: dict[str, str]) -> str:
    root = html.fragment_fromstring(row["content_body"], create_parent="div")
    title = row["chapter_title"]
    remove_empty_paragraphs(root)

    for node in root:
        if node.tag == "h4" and text(node) == "T he roles, rights and responsibilities of different family members":
            node.text = "The roles, rights and responsibilities of different family members"
        elif node.tag == "h4" and text(node) == "M odule 4":
            node.text = "Module 4"
        elif node.tag == "h4" and text(node) == "C ontraception method personal benefits against potential side effects and risks.":
            node.text = "Contraception method personal benefits against potential side effects and risks."

    if title in {"Characteristics of Unhealthy Relationships", "Unhealthy Relationships & Managing Sexual Emotions"}:
        group_paragraphs_after_heading(root, "Characteristics of Unhealthy Relationships", 5)
    elif title == "Where to Find Help":
        group_paragraphs_after_heading(root, "Who can you ask for help?", 5)
    elif title == "Human Rights Fundamentals":
        heading_paragraphs(root, {"human rights"}, "h4")
        group_paragraphs_after_heading(root, "Characteristics of human rights", 4)
    elif title == "Getting Help & Stopping Drug Abuse":
        group_paragraphs_after_heading(root, "How can I stop drug Abuse?", 4)
        heading_paragraphs(root, {"core components of the right to health"}, "h4")
    elif title == "Gender-Based Violence: Types & Prevention":
        heading_paragraphs(root, {"types of gender based violence"}, "h4")
    elif title == "Contraception":
        group_paragraphs_after_heading(root, "Types of contraception methods include:", 3)
        for node in root:
            if node.tag == "p" and text(node) == "2. Female Condoms**":
                node.tag = "h4"
                node.text = "2. Female Condoms"

    if title in {"SRH & Human Rights", "Duty Bearers, Rights Holders & Class Exercise"}:
        group_marked_paragraphs(root, r"^\s*\d+\.\s*", "ol")

    return serialize_blocks(root)


def rewrite(path: Path, field: str, formatter) -> None:
    with path.open(encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        fieldnames = reader.fieldnames
        rows = list(reader)
    assert fieldnames is not None
    for row in rows:
        row[field] = formatter(row)
    with path.open("w", encoding="utf-8", newline="") as target:
        writer = csv.DictWriter(target, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    print(f"Formatted {len(rows)} rows in {path}")


class Command(BaseCommand):
    help = "Repair semantic HTML in the archived blog and CSE seed CSVs."

    def handle(self, *args, **options):
        missing = [path for path in (BLOG_CSV, CSE_CSV) if not path.is_file()]
        if missing:
            raise CommandError(
                "Missing seed CSV file(s): " + ", ".join(str(path) for path in missing)
            )
        rewrite(BLOG_CSV, "body_html", format_blog)
        rewrite(CSE_CSV, "content_body", format_cse)
        self.stdout.write(self.style.SUCCESS("Seed HTML formatting complete."))
