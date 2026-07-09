from fastapi import APIRouter

from ..models import RagAskRequest, RagAskResponse, RagSource
from rag_engine import generator, retriever

router = APIRouter(prefix="/rag", tags=["RAG Knowledge Assistant"])

SNIPPET_LENGTH = 220


@router.post("/ask", response_model=RagAskResponse)
def ask(payload: RagAskRequest):
    """
    Retrieval-Augmented answer over the local markdown knowledge base
    (backend/knowledge_base/*.md). Retrieval is TF-IDF cosine similarity
    (rag_engine/retriever.py); the answer is generated directly from the
    top retrieved chunk (rag_engine/generator.py) — no external LLM call,
    so every answer is grounded in and traceable to the local corpus.
    """
    chunks = retriever.retrieve(payload.question, top_k=3)
    result = generator.generate_answer(chunks)

    sources = [
        RagSource(
            source=c["source"],
            heading=c["heading"],
            snippet=(c["text"][:SNIPPET_LENGTH] + "…") if len(c["text"]) > SNIPPET_LENGTH else c["text"],
            score=c["score"],
        )
        for c in chunks
    ]

    return RagAskResponse(answer=result["answer"], sources=sources, confidence=result["confidence"])
