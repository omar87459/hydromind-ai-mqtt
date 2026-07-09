"""
Local knowledge assistant (RAG-lite).

Prototype stand-in for a full Retrieval-Augmented Generation pipeline.
Instead of embeddings + a vector DB + an LLM generation step, this
retrieves the best-matching article from a local JSON knowledge base
using keyword overlap scoring, then returns its answer directly. The
retrieval interface (answer_question) is what a production RAG
pipeline would need to preserve: swap the scoring function for a
vector similarity search and this still plugs into the same API.
"""

import re
from typing import Optional

STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "to", "of", "and",
    "in", "on", "for", "it", "this", "that", "what", "why", "how", "do",
    "does", "can", "i", "my", "with", "if", "when", "why's", "should",
    "would", "will", "there", "which",
}


def _tokenize(text: str) -> set:
    words = re.findall(r"[a-zA-Z']+", text.lower())
    return {w for w in words if w not in STOPWORDS and len(w) > 1}


def _score(question_tokens: set, entry: dict) -> float:
    keywords = set(k.lower() for k in entry.get("keywords", []))
    if not keywords:
        return 0.0
    overlap = question_tokens & keywords
    if not overlap:
        return 0.0
    # reward proportion of the entry's keywords matched and question coverage
    keyword_coverage = len(overlap) / len(keywords)
    question_coverage = len(overlap) / max(len(question_tokens), 1)
    return round((keyword_coverage * 0.6 + question_coverage * 0.4), 4)


def answer_question(question: str, knowledge_base: list) -> dict:
    tokens = _tokenize(question)
    if not tokens:
        return {
            "answer": "Please ask a specific question about hydroponics — for example, "
            "'Why is pH important?' or 'How can I reduce EC?'",
            "matched_topic": None,
            "confidence": 0.0,
            "source_ids": [],
        }

    scored = [(entry, _score(tokens, entry)) for entry in knowledge_base]
    scored = [pair for pair in scored if pair[1] > 0]
    scored.sort(key=lambda pair: pair[1], reverse=True)

    if not scored:
        return {
            "answer": "I couldn't find that in the local hydroponic knowledge base yet. "
            "Try asking about pH, EC, water temperature, humidity, light, growth stages, "
            "or hydroponic methods.",
            "matched_topic": None,
            "confidence": 0.0,
            "source_ids": [],
        }

    best_entry, best_score = scored[0]
    confidence = round(min(best_score * 1.4, 0.98), 2)

    # If a couple of entries are close in score, blend the top match with a related note
    related = [e for e, s in scored[1:3] if s >= best_score * 0.7]
    answer = best_entry["answer"]
    if related:
        answer += " Related: " + " ".join(r["topic"] for r in related) + "."

    return {
        "answer": answer,
        "matched_topic": best_entry["topic"],
        "confidence": confidence,
        "source_ids": [best_entry["id"]] + [r["id"] for r in related],
    }
