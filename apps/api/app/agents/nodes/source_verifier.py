"""Agent B: Source Verifier"""
import json
from google import genai
from google.genai import types
from app.core.config import settings
from app.agents.prompts import SOURCE_VERIFIER_PROMPT


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

    prompt = SOURCE_VERIFIER_PROMPT.format(
        sources=json.dumps(sources_to_verify, ensure_ascii=False),
        claims=json.dumps(claims, ensure_ascii=False),
    )

    # Use Flash model with Google Search Grounding (fast search tasks)
    response = await client.aio.models.generate_content(
        model=settings.gemini_model_flash,
        contents=prompt,
        config=types.GenerateContentConfig(
            tools=[types.Tool(google_search=types.GoogleSearch())],
            response_mime_type="application/json",
            temperature=0.3,
        ),
    )

    try:
        result = json.loads(response.text)
    except json.JSONDecodeError:
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
                "status": "done",
                "message": "Source verification complete",
                "progress": 100,
            }
        ],
    }
