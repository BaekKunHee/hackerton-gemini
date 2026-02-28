"""Agent B: Source Verifier"""
import json
import asyncio
import logging
from google import genai
from google.genai import types
from app.core.config import settings
from app.agents.prompts import SOURCE_VERIFIER_PROMPT
from app.agents.utils import extract_json

logger = logging.getLogger(__name__)


async def source_verifier_node(state: dict) -> dict:
    """
    Agent B: Source Verifier
    - Uses Google Search Grounding to find original sources
    - Verifies citation accuracy
    - Calculates trust scores
    """

    client = genai.Client(api_key=settings.gemini_api_key)

    sources_to_verify = state.get("source_verifier_instructions", {}).get("sources", [])
    claims = state.get("claims", [])

    # Avoid str.format on JSON examples inside the prompt template.
    prompt = (
        SOURCE_VERIFIER_PROMPT
        .replace("{sources}", json.dumps(sources_to_verify, ensure_ascii=False))
        .replace("{claims}", json.dumps(claims, ensure_ascii=False))
    ) + "\n\nYou must respond in valid JSON format only."

    logger.info(f"[SourceVerifier] Starting verification for {len(sources_to_verify)} sources")
    logger.debug(f"[SourceVerifier] Sources: {sources_to_verify}")

    # Use Flash model with Google Search Grounding (fast search tasks)
    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=settings.gemini_model_flash,
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[types.Tool(google_search=types.GoogleSearch())],
                    temperature=0.3,
                ),
            ),
            timeout=60,
        )
    except asyncio.TimeoutError:
        logger.error("[SourceVerifier] Request timed out after 60 seconds")
        return {
            "verified_sources": [],
            "overall_trust_score": 0,
            "source_summary": "Source verification timed out",
            "agent_statuses": [
                {
                    "agent_id": "source",
                    "status": "error",
                    "message": "Source verification timed out",
                    "progress": 0,
                }
            ],
            "errors": [{"agent": "source", "error": "timeout"}],
        }

    try:
        logger.info(f"[SourceVerifier] Response received, length: {len(response.text)}")
        logger.debug(f"[SourceVerifier] Raw response: {response.text[:500]}...")
        result = extract_json(response.text)
        if not result:
            result = {
                "sources": [],
                "overall_trust_score": 0,
                "summary": "Unable to verify sources",
            }

        return {
            "verified_sources": result.get("sources", []),
            "overall_trust_score": result.get("overall_trust_score", 0),
            "source_summary": result.get("summary", ""),
            "agent_statuses": [
                {
                    "agent_id": "source",
                    "status": "searching",
                    "message": "Searching for original sources...",
                    "progress": 50,
                },
                {
                    "agent_id": "source",
                    "status": "done",
                    "message": "Source verification complete",
                    "progress": 100,
                },
            ],
        }
    except Exception as e:
        logger.exception(f"[SourceVerifier] Unexpected error: {str(e)}")
        return {
            "verified_sources": [],
            "overall_trust_score": 0,
            "source_summary": "",
            "agent_statuses": [
                {
                    "agent_id": "source",
                    "status": "error",
                    "message": f"Source verification failed: {str(e)}",
                    "progress": 0,
                }
            ],
            "errors": [{"agent": "source", "error": str(e)}],
        }
