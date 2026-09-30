"""Export reviewed summaries, not application boilerplate or private contact data."""
import csv
import json
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
            for key, heading in [("objectives", "Objectives"), ("activities", "Activities and approach"), ("findings", "Reported findings")]:
                if record.get(key):
                    sections.append("## " + heading + "\n\n" + "\n".join("- " + item for item in record[key]))
            row = {field: record.get(field, "") for field in FIELDS}
            row.update(status="completed" if record["evidence_type"] == "research" else "planning", description="\n\n".join(sections), source_documents=json.dumps(record["sources"], ensure_ascii=False))
            writer.writerow(row)
    print(f"Exported {len(records)} records covering {len(covered)} documents to {target}")

if __name__ == "__main__":
    export()
