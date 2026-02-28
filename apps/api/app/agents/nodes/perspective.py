"""Agent C: Perspective Explorer"""
import json
from google import genai
from google.genai import types
from app.core.config import settings
from app.agents.prompts import PERSPECTIVE_EXPLORER_PROMPT


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

    prompt = PERSPECTIVE_EXPLORER_PROMPT.format(
        topic=topic,
        keywords=json.dumps(keywords, ensure_ascii=False),
        claims=json.dumps(claims, ensure_ascii=False),
    )

    # Use Flash model with Google Search Grounding (fast search tasks)
    response = await client.aio.models.generate_content(
        model=settings.gemini_model_flash,
        contents=prompt,
        config=types.GenerateContentConfig(
            tools=[types.Tool(google_search=types.GoogleSearch())],
            response_mime_type="application/json",
            temperature=0.7,
        ),
    )

    try:
        result = json.loads(response.text)
    except json.JSONDecodeError:
        result = {
            "perspectives": [],
            "common_facts": [],
            "divergence_points": [],
            "summary": "",
        }

    return {
        "perspectives": result.get("perspectives", []),
        "common_facts": result.get("common_facts", []),
        "divergence_points": result.get("divergence_points", []),
        "perspective_summary": result.get("summary", ""),
        "agent_statuses": [
            {
                "agent_id": "perspective",
                "status": "done",
                "message": "Perspective exploration complete",
                "progress": 100,
            }
        ],
    }
