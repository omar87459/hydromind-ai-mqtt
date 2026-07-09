"""
Markdown knowledge base chunker.

Splits each .md file in backend/knowledge_base/ into retrievable chunks,
one per "## " heading section. This is a simple structural chunker — a
production RAG pipeline over a much larger corpus would likely use
overlapping token-window chunking, but heading-based chunks work well for a
small, curated, hand-written knowledge base like this prototype's.
"""

import re
from pathlib import Path

KB_DIR = Path(__file__).resolve().parent.parent / "knowledge_base"


def load_chunks() -> list:
    chunks = []
    for path in sorted(KB_DIR.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        lines = text.splitlines()
        title = lines[0].lstrip("#").strip() if lines else path.stem

        sections = re.split(r"^## ", text, flags=re.MULTILINE)[1:]
        for section in sections:
            heading_line, _, body = section.partition("\n")
            heading = heading_line.strip()
            body = body.strip()
            if not body:
                continue
            chunks.append(
                {
                    "source": path.stem,
                    "title": title,
                    "heading": heading,
                    "text": body,
                }
            )
    return chunks
