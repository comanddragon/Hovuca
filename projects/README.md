# HOVUCA project document catalogue

The 14 supplied DOCX/PDF files map to 13 reviewed records. The two Tonga baseline report copies are retained as sources for one research record. The PNG is an uncaptioned asset and is not treated as a project or assigned to a project without evidence.

`project_summaries.json` is the reviewed, public-safe content source. `export_projects.py` checks that every document is covered, validates excerpt lengths and writes `../Backend/data/document_projects.csv` with UTF-8 BOM, quoted multiline descriptions and JSON source filename arrays.

Raw applications contain personal contacts and banking details. The extraction output is for local review only; summaries omit those details and public pages display source names without publishing raw applications. Do not expose the `projects` directory through a web server.

## Regenerate and seed

Run the exporter from the repository root:

```powershell
python projects/export_projects.py
Backend/.venv/Scripts/python.exe Backend/manage.py migrate programs --settings=config.settings.development
Backend/.venv/Scripts/python.exe Backend/manage.py seed_document_projects --dry-run --settings=config.settings.development
Backend/.venv/Scripts/python.exe Backend/manage.py seed_document_projects --settings=config.settings.development
```

The importer is atomic, updates records by program and slug, preserves unrelated records and media, rejects cross-program slug collisions, and refuses ambiguous organizations. Use `--organization UUID` when necessary. A failed row rolls back the whole import. Development settings use the database configured in the backend environment; they do not create a separate SQLite catalogue. Production deployments must run the migration before deploying the new serializer, then run the seed command against their intended database.

## Evidence rules

- Funding applications and implementation plans retain `planning` status. Targets are described as proposed, regardless of whether their dates have passed.
- The two research studies have `completed` status for the studies themselves, not their parent programmes.
- `source_year` is a source/catalogue year, not a fabricated start date. Month-only periods remain text. Only explicit CFLI calendar dates populate start/end fields, with their contradictions disclosed.
- Budget, money raised and progress are not derived from funding limits or application requests.
- The 2024 UNAIDS schedule mixes 2023 and 2024 wording; the CFLI form contains inconsistent end/goal/signature dates. Both are flagged in evidence notes.
- Source titles are retained verbatim in the CSV. Public titles are concise editorial titles; summaries are paraphrases.

`extract_sources.py` reads DOCX paragraphs and tables in document order and PDF pages into `extracted/`. It requires `pypdf`; the exporter and seeder do not. The extraction manifest provides source hashes and coverage for local review.
