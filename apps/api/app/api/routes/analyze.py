"""Analysis API endpoints with SSE streaming"""
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from uuid import uuid4
import json

from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse
from app.services.session import session_store
from app.agents.graph import get_flipside_graph, get_initial_state

router = APIRouter(prefix="/api", tags=["analyze"])


def to_camel_case(snake_str: str) -> str:
    parts = snake_str.split('_')
    return parts[0] + ''.join(p.capitalize() for p in parts[1:])


def convert_keys(obj):
    if isinstance(obj, dict):
        return {to_camel_case(k): convert_keys(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_keys(i) for i in obj]
    return obj


def build_source_panel(verified_sources: list, trust_score: int, summary: str) -> dict:
    """Build SourcePanelData matching frontend type."""
    converted = convert_keys(verified_sources)
    overall_status = "verified"
    if converted:
        statuses = [s.get("verification", {}).get("status", "verified") for s in converted]
        if "distorted" in statuses:
            overall_status = "distorted"
        elif "context_missing" in statuses:
            overall_status = "context_missing"
    return {
        "originalSources": converted,
        "verificationStatus": overall_status,
        "trustScore": trust_score,
        "summary": summary,
    }


def build_perspective_panel(perspectives: list, common_facts: list, divergence_points: list) -> dict:
    """Build PerspectivePanelData matching frontend type."""
    return {
        "perspectives": convert_keys(perspectives),
        "commonFacts": common_facts,
        "divergencePoints": convert_keys(divergence_points),
    }


def build_bias_panel(detected_biases: list, claims: list) -> dict:
    """Build BiasPanelData matching frontend type."""
    bias_scores = []
    dominant_biases = []
    text_examples = []

    for bias in detected_biases:
        bias_type = bias.get("type", "")
        confidence = bias.get("confidence", 0)
        example = bias.get("example", "")

        bias_scores.append({"type": bias_type, "score": confidence})
        if confidence >= 0.5:
            dominant_biases.append(bias_type)
        if example:
            text_examples.append({
                "text": example,
                "biasType": bias_type,
                "explanation": f"Detected {bias_type.replace('_', ' ')} with {confidence:.0%} confidence",
            })

    return {
        "biasScores": bias_scores,
        "dominantBiases": dominant_biases,
        "textExamples": text_examples,
    }


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
        stream_open = True

        # Aggregate and persist final analysis output for /api/result.
        result_payload = {
            "session_id": session_id,
            "status": "analyzing",
            "claims": [],
            "detected_biases": [],
            "verified_sources": [],
            "overall_trust_score": 0,
            "source_summary": "",
            "perspectives": [],
            "common_facts": [],
            "divergence_points": [],
            "perspective_summary": "",
        }
        conversation_context = dict(session.conversation_context or {})

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
                # Keep running analysis even after disconnect so /result can be fetched.
                if stream_open and await request.is_disconnected():
                    stream_open = False

                for _, node_output in event.items():
                    # Accumulate result fields for final storage.
                    if "claims" in node_output:
                        result_payload["claims"] = node_output["claims"]
                    if "detected_biases" in node_output:
                        result_payload["detected_biases"] = node_output["detected_biases"]
                    if "verified_sources" in node_output:
                        result_payload["verified_sources"] = node_output["verified_sources"]
                    if "overall_trust_score" in node_output:
                        result_payload["overall_trust_score"] = node_output["overall_trust_score"]
                    if "perspectives" in node_output:
                        result_payload["perspectives"] = node_output["perspectives"]
                    if "common_facts" in node_output:
                        result_payload["common_facts"] = node_output["common_facts"]
                    if "divergence_points" in node_output:
                        result_payload["divergence_points"] = node_output["divergence_points"]
                    if "source_summary" in node_output:
                        result_payload["source_summary"] = node_output["source_summary"]
                    if "perspective_summary" in node_output:
                        result_payload["perspective_summary"] = node_output["perspective_summary"]

                    # Merge conversation context from parallel nodes for /api/chat.
                    if "conversation_context" in node_output:
                        conversation_context = {
                            **conversation_context,
                            **node_output["conversation_context"],
                        }
                    if "source_summary" in node_output:
                        conversation_context["source_summary"] = node_output["source_summary"]
                    if "perspective_summary" in node_output:
                        conversation_context["perspective_summary"] = node_output["perspective_summary"]
                    if "detected_biases" in node_output:
                        conversation_context["detected_biases"] = node_output["detected_biases"]
                    if "claims" in node_output:
                        conversation_context["claims"] = node_output["claims"]

                    # Send agent status updates
                    if "agent_statuses" in node_output:
                        for status in node_output["agent_statuses"]:
                            sse_data = {
                                "type": "agent_status",
                                "payload": convert_keys(status)
                            }
                            if stream_open:
                                yield f"data: {json.dumps(sse_data)}\n\n"

                    # Send panel updates
                    if "verified_sources" in node_output and node_output["verified_sources"]:
                        sse_data = {
                            "type": "panel_update",
                            "panel": "source",
                            "payload": build_source_panel(
                                node_output["verified_sources"],
                                node_output.get("overall_trust_score", 0),
                                node_output.get("source_summary", "")
                            )
                        }
                        if stream_open:
                            yield f"data: {json.dumps(sse_data)}\n\n"

                    if "perspectives" in node_output and node_output["perspectives"]:
                        sse_data = {
                            "type": "panel_update",
                            "panel": "perspective",
                            "payload": build_perspective_panel(
                                node_output["perspectives"],
                                node_output.get("common_facts", []),
                                node_output.get("divergence_points", [])
                            )
                        }
                        if stream_open:
                            yield f"data: {json.dumps(sse_data)}\n\n"

                    if "detected_biases" in node_output and node_output["detected_biases"]:
                        sse_data = {
                            "type": "panel_update",
                            "panel": "bias",
                            "payload": build_bias_panel(
                                node_output["detected_biases"],
                                node_output.get("claims", [])
                            )
                        }
                        if stream_open:
                            yield f"data: {json.dumps(sse_data)}\n\n"

                    # Persist incremental state for result/chat recovery.
                    session_store.update(
                        session_id,
                        result=result_payload,
                        conversation_context=conversation_context
                    )

            # Mark session as done
            result_payload["status"] = "done"
            session_store.update(
                session_id,
                status="done",
                result=result_payload,
                conversation_context=conversation_context
            )

            # Send completion event
            if stream_open:
                analysis_result = {
                    "source": build_source_panel(
                        result_payload.get("verified_sources", []),
                        result_payload.get("overall_trust_score", 0),
                        result_payload.get("source_summary", "")
                    ),
                    "perspective": build_perspective_panel(
                        result_payload.get("perspectives", []),
                        result_payload.get("common_facts", []),
                        result_payload.get("divergence_points", [])
                    ),
                    "bias": build_bias_panel(
                        result_payload.get("detected_biases", []),
                        result_payload.get("claims", [])
                    ),
                    "steelMan": {
                        "opposingArgument": "",
                        "strengthenedArgument": "",
                    },
                }
                complete_data = {
                    "type": "analysis_complete",
                    "payload": {
                        "sessionId": session_id,
                        "result": analysis_result,
                    }
                }
                yield f"data: {json.dumps(complete_data)}\n\n"

        except Exception as e:
            result_payload["status"] = "error"
            session_store.update(
                session_id,
                status="error",
                result=result_payload,
                conversation_context=conversation_context
            )
            error_data = {
                "type": "error",
                "payload": {
                    "code": "ANALYSIS_FAILED",
                    "message": str(e)
                }
            }
            if stream_open:
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
