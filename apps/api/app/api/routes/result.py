"""Result retrieval endpoint"""
from fastapi import APIRouter, HTTPException
from app.schemas.analyze import AnalysisResult
from app.services.session import session_store

router = APIRouter(prefix="/api", tags=["result"])


@router.get("/result/{session_id}")
async def get_result(session_id: str):
    """Get the analysis result for a session."""
    session = session_store.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": session_id,
        "status": session.status,
        "result": session.result,
        "conversation_context": session.conversation_context
    }
