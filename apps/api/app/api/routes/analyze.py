"""Analysis API endpoints with SSE streaming"""
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from uuid import uuid4
import json
import asyncio

from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse, AnalysisResult
from app.schemas.agent import AgentState
from app.services.session import session_store
from app.agents.graph import get_flipside_graph, get_initial_state

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def start_analysis(request: AnalyzeRequest):
    """Start a new analysis session."""
    session_id = str(uuid4())

    # Create session
    session_store.create(
        session_id=session_id,
        content_type=request.type,
        content=request.content
    )

    return AnalyzeResponse(
        session_id=session_id,
        status="started",
        stream_url=f"/api/stream/{session_id}"
    )


@router.get("/stream/{session_id}")
async def stream_analysis(session_id: str, request: Request):
    """
    SSE endpoint for streaming analysis progress.
    Uses LangGraph's async streaming.
    """
    session = session_store.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    async def event_generator():
        graph = get_flipside_graph()

        # Initial state
        initial_state = get_initial_state(
            session_id=session_id,
            content_type=session.content_type,
            content=session.content
        )

        # Update session status
        session_store.update(session_id, status="analyzing")

        try:
            # Stream using 'updates' mode to get incremental state changes
            async for event in graph.astream(initial_state, stream_mode="updates"):
                # Check for client disconnect
                if await request.is_disconnected():
                    break

                for node_name, node_output in event.items():
                    # Send agent status updates
                    if "agent_statuses" in node_output:
                        for status in node_output["agent_statuses"]:
                            sse_data = {
                                "type": "agent_status",
                                "payload": status
                            }
                            yield f"data: {json.dumps(sse_data)}\n\n"

                    # Send panel updates
                    if "verified_sources" in node_output and node_output["verified_sources"]:
                        sse_data = {
                            "type": "panel_update",
                            "panel": "source",
                            "payload": {
                                "sources": node_output["verified_sources"],
                                "trust_score": node_output.get("overall_trust_score", 0),
                                "summary": node_output.get("source_summary", "")
                            }
                        }
                        yield f"data: {json.dumps(sse_data)}\n\n"

                    if "perspectives" in node_output and node_output["perspectives"]:
                        sse_data = {
                            "type": "panel_update",
                            "panel": "perspective",
                            "payload": {
                                "perspectives": node_output["perspectives"],
                                "common_facts": node_output.get("common_facts", []),
                                "divergence_points": node_output.get("divergence_points", [])
                            }
                        }
                        yield f"data: {json.dumps(sse_data)}\n\n"

                    if "detected_biases" in node_output and node_output["detected_biases"]:
                        sse_data = {
                            "type": "panel_update",
                            "panel": "bias",
                            "payload": {
                                "biases": node_output["detected_biases"],
                                "claims": node_output.get("claims", [])
                            }
                        }
                        yield f"data: {json.dumps(sse_data)}\n\n"

                    # Store results in session
                    if "conversation_context" in node_output:
                        session_store.update(
                            session_id,
                            conversation_context=node_output["conversation_context"]
                        )

            # Mark session as done
            session_store.update(session_id, status="done")

            # Send completion event
            yield f"data: {json.dumps({'type': 'analysis_complete', 'payload': {'session_id': session_id}})}\n\n"

        except Exception as e:
            session_store.update(session_id, status="error")
            error_data = {
                "type": "error",
                "payload": {
                    "code": "ANALYSIS_FAILED",
                    "message": str(e)
                }
            }
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
