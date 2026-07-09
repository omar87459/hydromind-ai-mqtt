from fastapi import APIRouter

from .. import data_store
from ..models import AssistantRequest
from ..services import knowledge_assistant

router = APIRouter(tags=["AI Knowledge Assistant"])


@router.post("/assistant")
def ask_assistant(payload: AssistantRequest):
    """
    Answers a hydroponics question using the local knowledge base.
    This is a simplified stand-in for a full RAG pipeline: retrieval
    is keyword-overlap based instead of vector similarity, and there
    is no external LLM call — the retrieved article is returned
    directly, which keeps the assistant fully offline.
    """
    kb = data_store.get_knowledge_base()
    result = knowledge_assistant.answer_question(payload.question, kb)
    return result
