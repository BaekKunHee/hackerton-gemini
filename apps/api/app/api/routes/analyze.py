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


def build_perspective_panel(
    perspectives: list,
    common_facts: list,
    divergence_points: list,
    perspective_image: dict | None = None,
) -> dict:
    """Build PerspectivePanelData matching frontend type."""
    panel = {
        "perspectives": convert_keys(perspectives),
        "commonFacts": common_facts,
        "divergencePoints": convert_keys(divergence_points),
    }
    if perspective_image:
        panel["spectrumVisualization"] = {
            "imageDataUrl": (
                f"data:{perspective_image.get('mime_type', 'image/png')};base64,"
                f"{perspective_image.get('base64_data', '')}"
            ),
            "caption": perspective_image.get("caption", ""),
            "chartType": "auto",
        }
    return panel


def build_bias_panel(
    detected_biases: list,
    claims: list,
    expanded_topics: list = None,
    related_content: list = None,
    alternative_framing: str = None,
    user_instincts: list = None,
    information_biases: list = None,
) -> dict:
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

    result = {
        "biasScores": bias_scores,
        "dominantBiases": dominant_biases,
        "textExamples": text_examples,
    }

    # Add new Agent A structure: user instincts (Hans Rosling 10)
    if user_instincts:
        result["userInstincts"] = convert_keys(user_instincts)

    # Add new Agent A structure: information/media biases
    if information_biases:
        result["informationBiases"] = convert_keys(information_biases)

    # Add alternative framing (always include with default if not provided)
    if alternative_framing:
        result["alternativeFraming"] = alternative_framing
    else:
        # Default framing based on detected biases
        if dominant_biases or user_instincts or information_biases:
            result["alternativeFraming"] = "이 콘텐츠는 특정 관점에서 작성되었습니다. 동일한 사실을 다른 프레임으로 바라보면, 더 균형 잡힌 이해가 가능합니다. 위에서 감지된 편향 패턴을 인식하면서 다양한 관점의 정보를 함께 살펴보세요."
        elif text_examples:
            result["alternativeFraming"] = "제시된 텍스트 예시들을 다른 맥락에서 해석해보세요. 같은 사실도 어떤 프레임으로 보느냐에 따라 전혀 다른 결론에 도달할 수 있습니다."

    # Add expanded topics if available
    if expanded_topics:
        result["expandedTopics"] = convert_keys(expanded_topics)

    # Add related content if available
    if related_content:
        result["relatedContent"] = convert_keys(related_content)

    return result


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
            "user_instincts": [],
            "information_biases": [],
            "verified_sources": [],
            "overall_trust_score": 0,
            "source_summary": "",
            "perspectives": [],
            "common_facts": [],
            "divergence_points": [],
            "perspective_summary": "",
            "perspective_image": None,
            "steel_man": None,
            "alternative_framing": "",
            "expanded_topics": [],
            "related_content": [],
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
                    if "user_instincts" in node_output:
                        result_payload["user_instincts"] = node_output["user_instincts"]
                    if "information_biases" in node_output:
                        result_payload["information_biases"] = node_output["information_biases"]
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
                    if "perspective_image" in node_output:
                        result_payload["perspective_image"] = node_output["perspective_image"]
                    if "steel_man" in node_output and node_output["steel_man"]:
                        result_payload["steel_man"] = node_output["steel_man"]
                    if "expanded_topics" in node_output:
                        result_payload["expanded_topics"] = node_output["expanded_topics"]
                    if "related_content" in node_output:
                        result_payload["related_content"] = node_output["related_content"]
                    if "alternative_framing" in node_output:
                        result_payload["alternative_framing"] = node_output["alternative_framing"]

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
                                node_output.get("divergence_points", []),
                                node_output.get("perspective_image"),
                            )
                        }
                        if stream_open:
                            yield f"data: {json.dumps(sse_data)}\n\n"

                    if "perspective_image" in node_output and node_output["perspective_image"]:
                        sse_data = {
                            "type": "panel_update",
                            "panel": "perspective",
                            "payload": build_perspective_panel(
                                result_payload.get("perspectives", []),
                                result_payload.get("common_facts", []),
                                result_payload.get("divergence_points", []),
                                result_payload.get("perspective_image"),
                            )
                        }
                        if stream_open:
                            yield f"data: {json.dumps(sse_data)}\n\n"

                    # Send bias panel update when any bias-related data arrives
                    has_bias_data = (
                        ("detected_biases" in node_output and node_output["detected_biases"]) or
                        ("user_instincts" in node_output and node_output["user_instincts"]) or
                        ("information_biases" in node_output and node_output["information_biases"])
                    )
                    if has_bias_data:
                        sse_data = {
                            "type": "panel_update",
                            "panel": "bias",
                            "payload": build_bias_panel(
                                node_output.get("detected_biases", result_payload.get("detected_biases", [])),
                                node_output.get("claims", result_payload.get("claims", [])),
                                user_instincts=node_output.get("user_instincts", []),
                                information_biases=node_output.get("information_biases", []),
                            )
                        }
                        if stream_open:
                            yield f"data: {json.dumps(sse_data)}\n\n"

                    # Send expanded topics, related content, and alternative framing as bias panel update
                    if "expanded_topics" in node_output or "related_content" in node_output or "alternative_framing" in node_output:
                        expanded = node_output.get("expanded_topics", [])
                        related = node_output.get("related_content", [])
                        framing = node_output.get("alternative_framing", "")
                        if expanded or related or framing:
                            sse_data = {
                                "type": "panel_update",
                                "panel": "bias",
                                "payload": build_bias_panel(
                                    result_payload.get("detected_biases", []),
                                    result_payload.get("claims", []),
                                    expanded,
                                    related,
                                    framing,
                                    user_instincts=result_payload.get("user_instincts", []),
                                    information_biases=result_payload.get("information_biases", []),
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
                        result_payload.get("divergence_points", []),
                        result_payload.get("perspective_image"),
                    ),
                    "bias": build_bias_panel(
                        result_payload.get("detected_biases", []),
                        result_payload.get("claims", []),
                        result_payload.get("expanded_topics", []),
                        result_payload.get("related_content", []),
                        result_payload.get("alternative_framing", ""),
                        user_instincts=result_payload.get("user_instincts", []),
                        information_biases=result_payload.get("information_biases", []),
                    ),
                    "steelMan": convert_keys(result_payload.get("steel_man", {})) or {
                        "opposingArgument": "",
                        "strengthenedArgument": "",
                        "refutationPoints": [],
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
