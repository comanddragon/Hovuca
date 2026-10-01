"""Export reviewed summaries, not application boilerplate or private contact data."""
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FIELDS = ["slug", "title", "source_title", "program_slug", "source_year", "evidence_type", "location", "reporting_period", "status", "start_date", "end_date", "excerpt", "description", "source_documents", "evidence_notes"]

def export():
    records = json.loads((ROOT / "project_summaries.json").read_text(encoding="utf-8"))
    paths = {p.relative_to(ROOT).as_posix() for p in ROOT.rglob("*") if p.suffix.lower() in {".docx", ".pdf"}}
    covered = {p for record in records for p in record["sources"]}
    if paths != covered:
        raise ValueError(f"Source coverage mismatch: missing={paths-covered}, unknown={covered-paths}")
    if len({r['slug'] for r in records}) != len(records):
        raise ValueError("Duplicate project slugs")
    target = ROOT.parent / "Backend" / "data" / "document_projects.csv"
    with target.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=FIELDS)
        writer.writeheader()
        for record in records:
            if len(record["excerpt"]) > 500:
                raise ValueError(f"Excerpt too long: {record['slug']}")
            sections = [record["overview"]]
            for key, heading in [("objectives", "Objectives"), ("findings", "Reported findings")]:
                if record.get(key):
                    sections.append("## " + heading + "\n\n" + "\n".join("- " + item for item in record[key]))
            row = {field: record.get(field, "") for field in FIELDS}
            row.update(status="completed" if record["evidence_type"] == "research" else "planning", description="\n\n".join(sections), source_documents=json.dumps(record["sources"], ensure_ascii=False))
            writer.writerow(row)
    print(f"Exported {len(records)} records covering {len(covered)} documents to {target}")
    activity_groups = json.loads((ROOT / "project_activities.json").read_text(encoding="utf-8"))
    if set(activity_groups) != {record["slug"] for record in records}:
        raise ValueError("Activity groups must cover every reviewed project")
    activity_target = target.with_name("document_project_activities.csv")
    activity_fields = ["project_slug", "slug", "title", "description", "period", "evidence_status", "order", "source_documents"]
    count = 0
    with activity_target.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=activity_fields)
        writer.writeheader()
        for record in records:
            seen = set()
            for order, (title, description, period) in enumerate(activity_groups[record["slug"]], 1):
                slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
                if slug in seen or len(title) > 255 or len(period) > 255:
                    raise ValueError(f"Invalid activity in {record['slug']}: {title}")
                seen.add(slug)
                writer.writerow(dict(project_slug=record["slug"], slug=slug, title=title, description=description, period=period, evidence_status="reported" if record["evidence_type"] == "research" else "planned", order=order, source_documents=json.dumps(record["sources"], ensure_ascii=False)))
                count += 1
    print(f"Exported {count} activities to {activity_target}")

if __name__ == "__main__":
    export()
