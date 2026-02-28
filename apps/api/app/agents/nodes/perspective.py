"""Agent C: Perspective Explorer"""
import json
import asyncio
import logging
from google import genai
from google.genai import types
from app.core.config import settings
from app.core.gemini import generate_perspective_spectrum_image
from app.agents.prompts import PERSPECTIVE_EXPLORER_PROMPT
from app.agents.utils import extract_json

logger = logging.getLogger(__name__)


async def perspective_explorer_node(state: dict) -> dict:
    """
    Agent C: Perspective Explorer
    - Uses Google Search to find alternative viewpoints
    - Analyzes different frames on the same facts
    - Creates perspective spectrum map
    """

    client = genai.Client(api_key=settings.gemini_api_key)

    instructions = state.get("perspective_instructions", {})
    topic = instructions.get("topic", "")
    keywords = instructions.get("keywords", [])
    claims = state.get("claims", [])

    # If no topic, extract from claims
    if not topic and claims:
        topic = claims[0].get("text", "") if claims else ""

    # Avoid str.format on JSON examples inside the prompt template.
    prompt = (
        PERSPECTIVE_EXPLORER_PROMPT
        .replace("{topic}", topic)
        .replace("{keywords}", json.dumps(keywords, ensure_ascii=False))
        .replace("{claims}", json.dumps(claims, ensure_ascii=False))
    ) + "\n\nYou must respond in valid JSON format only."

    logger.info(f"[PerspectiveExplorer] Starting exploration for topic: {topic[:50]}...")
    logger.debug(f"[PerspectiveExplorer] Keywords: {keywords}")

    # Use Flash model with Google Search Grounding (fast search tasks)
    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=settings.gemini_model_flash,
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[types.Tool(google_search=types.GoogleSearch())],
                    temperature=0.7,
                ),
            ),
            timeout=60,
        )
    except asyncio.TimeoutError:
        logger.error("[PerspectiveExplorer] Request timed out after 60 seconds")
        return {
            "perspectives": [],
            "common_facts": [],
            "divergence_points": [],
            "perspective_summary": "Perspective exploration timed out",
            "agent_statuses": [
                {
                    "agent_id": "perspective",
                    "status": "error",
                    "message": "Perspective exploration timed out",
                    "progress": 0,
                }
            ],
            "errors": [{"agent": "perspective", "error": "timeout"}],
        }

    try:
        logger.info(f"[PerspectiveExplorer] Response received, length: {len(response.text)}")
        logger.debug(f"[PerspectiveExplorer] Raw response: {response.text[:500]}...")
        result = extract_json(response.text)
        if not result:
            result = {
                "perspectives": [],
                "common_facts": [],
                "divergence_points": [],
                "summary": "",
            }

        perspectives = result.get("perspectives", [])
        perspective_image = None
        if perspectives:
            try:
                perspective_image = await generate_perspective_spectrum_image(
                    topic=topic,
                    perspectives=perspectives,
                )
            except Exception:
                logger.exception("[PerspectiveExplorer] Image generation failed")

        return {
            "perspectives": perspectives,
            "common_facts": result.get("common_facts", []),
            "divergence_points": result.get("divergence_points", []),
            "perspective_summary": result.get("summary", ""),
            "perspective_image": perspective_image,
            "agent_statuses": [
                {
                    "agent_id": "perspective",
                    "status": "searching",
                    "message": "Exploring alternative perspectives...",
                    "progress": 50,
                },
                {
                    "agent_id": "perspective",
                    "status": "done",
                    "message": "Perspective exploration complete",
                    "progress": 100,
                },
            ],
        }
    except Exception as e:
        logger.exception(f"[PerspectiveExplorer] Unexpected error: {str(e)}")
        return {
            "perspectives": [],
            "common_facts": [],
            "divergence_points": [],
            "perspective_summary": "",
            "perspective_image": None,
            "agent_statuses": [
                {
                    "agent_id": "perspective",
                    "status": "error",
                    "message": f"Perspective exploration failed: {str(e)}",
                    "progress": 0,
                }
            ],
            "errors": [{"agent": "perspective", "error": str(e)}],
        }
