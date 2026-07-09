"""
Extractive answer generation.

PROTOTYPE NOTE: a production RAG pipeline would pass the retrieved chunks
to an LLM to synthesize a fluent, blended answer. This prototype instead
returns the best-matching retrieved chunk's text directly as the answer
(no external model call, fully offline, and every claim is traceable to a
source chunk) — the raw source snippets are returned alongside it so the
UI can show exactly what was retrieved and let the user judge relevance
themselves.
"""

FALLBACK_ANSWER = (
    "I couldn't find that in the local hydroponic knowledge base yet. Try asking about pH, EC, "
    "water temperature, lighting, nutrients, hydroponic methods, crop requirements, growth "
    "stages, root health, or remote farm connectivity."
)


def generate_answer(retrieved_chunks: list) -> dict:
    if not retrieved_chunks:
        return {"answer": FALLBACK_ANSWER, "confidence": 0.0}

    top = retrieved_chunks[0]
    answer = top["text"]

    related = [c for c in retrieved_chunks[1:3] if c["score"] >= top["score"] * 0.55]
    if related:
        related_headings = ", ".join(f"{c['title']} — {c['heading']}" for c in related)
        answer += f"\n\nRelated topics: {related_headings}."

    confidence = round(min(top["score"] * 1.6, 0.98), 2)
    return {"answer": answer, "confidence": confidence}
