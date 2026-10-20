"""Extract source text for review; preserves DOCX table order and PDF page labels."""
from pathlib import Path
import hashlib
import json
import zipfile
import xml.etree.ElementTree as ET
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

def main():
    output = ROOT / "extracted"
    output.mkdir(exist_ok=True)
    manifest = []
    seen = {}
    for path in sorted(ROOT.rglob("*")):
        if path.suffix.lower() not in {".docx", ".pdf"}:
            continue
        if path.suffix.lower() == ".docx":
            with zipfile.ZipFile(path) as archive:
                tree = ET.fromstring(archive.read("word/document.xml"))
            paragraphs = ["".join(t.text or "" for t in p.findall(".//w:t", NS)) for p in tree.findall(".//w:p", NS)]
            content = "\n".join(p for p in paragraphs if p.strip())
        else:
            content = "\n".join(f"[Page {i}]\n{page.extract_text()}" for i, page in enumerate(PdfReader(path).pages, 1))
        digest = hashlib.sha256(content.encode()).hexdigest()
        target = output / (path.parent.name + "--" + path.stem + ".txt")
        target.write_text(content, encoding="utf-8")
        source = path.relative_to(ROOT).as_posix()
        manifest.append({"source": source, "text": target.relative_to(ROOT).as_posix(), "characters": len(content), "sha256": digest, "duplicate_of": seen.get(digest, "")})
        seen.setdefault(digest, source)
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(manifest, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
