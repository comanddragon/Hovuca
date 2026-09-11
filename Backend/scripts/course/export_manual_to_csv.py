import csv
import html
import sys
from pathlib import Path

import docx


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

# Backend/
BASE_DIR = Path(__file__).resolve().parent.parent

# Backend/input/
SOURCE_DIR = BASE_DIR / "course" / "input"

# Backend/output/
OUTPUT_DIR = BASE_DIR / "course" / "output"

# Create output directory if it doesn't exist
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

SOURCE_FILE = SOURCE_DIR / "CSE Manual.docx"
OUTPUT_FILE = OUTPUT_DIR / "cse_manual.csv"

SUBJECT = {"name": "Comprehensive Sexuality Education (CSE)", "slug": "cse"}
COURSE = {
    "title": "Comprehensive Sexuality Education Training",
    "slug": "cse-training",
    "description": (
        "HOVUCA's CSE curriculum covering relationships, sexual and "
        "reproductive health, life skills, gender, human rights, and "
        "substance abuse for learners aged 10 and above."
    ),
    "difficulty": "beginner",
}

# (module_title, module_order, age_min, age_max, module_description, [chapters])
# chapter = (title, order, (start_para, end_para), [table_indices])
MODULES = [
    ("Module 1: Relationship", 1, 10, 15, "Family, friendship and relationships for younger adolescents.", [
        ("Family Roles & Resolving Conflict", 1, (86, 118), []),
        ("Friendship, Love, Romantic Relationships & Dating", 2, (119, 140), []),
        ("Building Healthy Relationships", 3, (143, 153), []),
        ("Characteristics of Unhealthy Relationships", 4, (154, 162), []),
    ]),
    ("Module 2: Sexual and Reproductive Health", 2, 10, 15, "SRH fundamentals for younger adolescents.", [
        ("Key Definitions & SRH Rights", 1, (166, 193), []),
        ("Reproductive System (Female & Male Anatomy)", 2, (194, 213), []),
        ("Puberty & Physical/Emotional Changes", 3, (214, 240), []),
        ("Menstruation & Menstrual Health", 4, (241, 329), []),
        ("HIV & STIs", 5, (330, 526), [0, 1]),
        ("Contraception", 6, (527, 611), []),
    ]),
    ("Module 1: Relationship", 3, 15, None, "Relationships for older adolescents and above.", [
        ("Friendship, Love, Romantic Relationships & Dating", 1, (615, 639), []),
        ("Building Healthy Relationships", 2, (640, 650), []),
        ("Unhealthy Relationships & Managing Sexual Emotions", 3, (651, 671), []),
    ]),
    ("Module 2: Sexual and Reproductive Health", 4, 15, None, "SRH for older adolescents and above.", [
        ("Key Definitions & SRH Rights", 1, (675, 702), []),
        ("Reproductive System (Female & Male Anatomy)", 2, (703, 721), []),
        ("Menstrual Hygiene & Management", 3, (722, 808), []),
        ("HIV & STIs", 4, (809, 1010), [2, 3]),
        ("Contraception", 5, (1011, 1159), []),
        ("Abortion & Safe Reproductive Choices", 6, (1160, 1186), []),
    ]),
    ("Module 3: Personal / Life Skills", 5, 10, None, "Values, decision making and social skills.", [
        ("Values & Decision Making", 1, (1189, 1210), []),
        ("Assertiveness, Social & Negotiating Skills", 2, (1211, 1233), []),
        ("Where to Find Help", 3, (1234, 1246), []),
    ]),
    ("Module 4: Gender Roles and Norms", 6, 10, None, "Gender roles, inequality and gender-based violence.", [
        ("Gender Roles & Stereotypes", 1, (1247, 1273), []),
        ("Gender Inequality", 2, (1274, 1285), []),
        ("Gender-Based Violence: Types & Prevention", 3, (1286, 1338), [4]),
    ]),
    ("Module 5: Human Rights", 7, 10, None, "Human rights and their link to SRH.", [
        ("Human Rights Fundamentals", 1, (1339, 1346), []),
        ("SRH & Human Rights", 2, (1347, 1362), []),
        ("Duty Bearers, Rights Holders & Class Exercise", 3, (1363, 1374), [5]),
    ]),
    ("Module 6: Drug Abuse", 8, 10, None, "Substance abuse: causes, risks and getting help.", [
        ("Understanding Drug Abuse", 1, (1375, 1400), []),
        ("Signs, Risks & Consequences of Drug Abuse", 2, (1401, 1427), []),
        ("Getting Help & Stopping Drug Abuse", 3, (1428, 1439), []),
    ]),
]


def runs_to_html(paragraph):
    parts = []
    for run in paragraph.runs:
        text = html.escape(run.text)
        if not text:
            continue
        parts.append(f"<strong>{text}</strong>" if run.bold else text)
    return "".join(parts) or html.escape(paragraph.text)


def table_to_html(table):
    rows = ["<table>"]
    for row in table.rows:
        cells = "".join(f"<td>{html.escape(c.text.strip())}</td>" for c in row.cells)
        rows.append(f"<tr>{cells}</tr>")
    rows.append("</table>")
    return "\n".join(rows)


def paragraphs_to_html(paragraphs):
    html_parts = []
    list_buffer = []

    def flush_list():
        if list_buffer:
            html_parts.append("<ul>" + "".join(f"<li>{li}</li>" for li in list_buffer) + "</ul>")
            list_buffer.clear()

    for p in paragraphs:
        text = p.text.strip()
        if not text:
            continue
        if p.style.name == "List Paragraph":
            list_buffer.append(runs_to_html(p))
            continue
        flush_list()
        if p.style.name in ("Heading 2", "Heading 3"):
            html_parts.append(f"<h4>{html.escape(text)}</h4>")
        else:
            html_parts.append(f"<p>{runs_to_html(p)}</p>")
    flush_list()
    return "\n".join(html_parts)


def build_chapter_body(doc, para_range, table_indices):
    start, end = para_range
    body = paragraphs_to_html(doc.paragraphs[start:end + 1])
    for idx in table_indices:
        body += "\n" + table_to_html(doc.tables[idx])
    return body


def estimate_minutes(body_html):
    word_count = len(body_html.split())
    return max(3, round(word_count / 200))


def main(docx_path, csv_path):
    doc = docx.Document(docx_path)

    rows = []
    for module_title, module_order, age_min, age_max, module_desc, chapters in MODULES:
        for chapter_title, chapter_order, para_range, table_indices in chapters:
            body = build_chapter_body(doc, para_range, table_indices)
            rows.append({
                "subject_name": SUBJECT["name"],
                "subject_slug": SUBJECT["slug"],
                "course_title": COURSE["title"],
                "course_slug": COURSE["slug"],
                "course_description": COURSE["description"],
                "course_difficulty": COURSE["difficulty"],
                "module_title": module_title,
                "module_order": module_order,
                "module_age_min": age_min,
                "module_age_max": age_max if age_max is not None else "",
                "module_description": module_desc,
                "chapter_title": chapter_title,
                "chapter_order": chapter_order,
                "content_type": "text",
                "duration_minutes": estimate_minutes(body),
                "content_body": body,
            })

    fieldnames = list(rows[0].keys())
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} chapters to {csv_path}")


if __name__ == "__main__":
    if not SOURCE_FILE.exists():
        print(f"Source file not found: {SOURCE_FILE}")
        sys.exit(1)

    main(SOURCE_FILE, OUTPUT_FILE)