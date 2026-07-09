"""
TF-IDF retriever over the local knowledge_base markdown corpus.

Stands in for a full embeddings + vector database retrieval step. TF-IDF is
a classic sparse retrieval method: each chunk (and the query) is
represented as a vector of term-frequency / inverse-document-frequency
weights, and relevance is cosine similarity between the query vector and
each chunk vector. It requires no model download and runs fully offline,
which suits a hackathon prototype well.

PROTOTYPE NOTE: swap this module for a sentence-transformers embedding
index plus a real vector database (e.g. FAISS, pgvector) to scale to a much
larger corpus — scientific papers, equipment manuals, historical farm
records — without changing the retrieve() interface below.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .chunker import load_chunks

_chunks = None
_vectorizer = None
_matrix = None


def _ensure_index():
    global _chunks, _vectorizer, _matrix
    if _chunks is not None:
        return
    _chunks = load_chunks()
    # Title and heading are repeated to weight them more heavily than body
    # text — a chunk whose heading/title directly names the query subject
    # (e.g. "Lettuce", "How to reduce EC") should outrank a chunk that only
    # shares incidental body-text vocabulary.
    corpus = [
        f"{c['title']} {c['title']} {c['heading']} {c['heading']} {c['heading']} {c['text']}"
        for c in _chunks
    ]
    _vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    _matrix = _vectorizer.fit_transform(corpus)


def corpus_size() -> int:
    _ensure_index()
    return len(_chunks)


def _exact_match_boost(query_words: set, chunk: dict) -> float:
    """
    Small additive bonus when a heading/title word appears verbatim in the
    query — e.g. a chunk headed "Lettuce" should reliably win for "best
    method for lettuce" over a same-topic chunk that never names the crop,
    even when their pure TF-IDF cosine scores are within noise of each other.
    """
    heading_words = set(chunk["heading"].lower().split())
    title_words = set(chunk["title"].lower().split())
    boost = 0.0
    if heading_words & query_words:
        boost += 0.08
    if title_words & query_words:
        boost += 0.04
    return boost


def retrieve(query: str, top_k: int = 3) -> list:
    """Returns up to top_k chunks ranked by relevance to the query, each with a 'score' field."""
    _ensure_index()
    if not query.strip():
        return []
    query_vec = _vectorizer.transform([query])
    cosine_scores = cosine_similarity(query_vec, _matrix)[0]
    query_words = set(query.lower().split())

    scored = [
        (chunk, float(score) + _exact_match_boost(query_words, chunk))
        for chunk, score in zip(_chunks, cosine_scores)
    ]
    ranked = sorted(scored, key=lambda pair: pair[1], reverse=True)

    results = []
    for chunk, score in ranked[:top_k]:
        if score <= 0:
            continue
        results.append({**chunk, "score": round(score, 4)})
    return results
