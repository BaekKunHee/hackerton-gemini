"""Aggregate Results Node - Generates Steel Man analysis"""
import json
import logging
from google import genai
from google.genai import types
from app.core.config import settings
from app.agents.prompts import STEEL_MAN_GENERATOR_PROMPT
from app.agents.utils import extract_json

logger = logging.getLogger(__name__)


async def aggregate_results_node(state: dict) -> dict:
    """
    Aggregates results from all parallel agents.
    Generates Steel Man analysis with refutation points.
    """

    claims = state.get("claims", [])
    detected_biases = state.get("detected_biases", [])
    perspectives = state.get("perspectives", [])
    verified_sources = state.get("verified_sources", [])

    logger.info(f"[Aggregate] Starting with claims={len(claims)}, biases={len(detected_biases)}, perspectives={len(perspectives)}")

    steel_man = None

    # Generate Steel Man if we have analysis data
    if claims or detected_biases or perspectives:
        try:
            logger.info("[Aggregate] Generating Steel Man analysis...")
            client = genai.Client(api_key=settings.gemini_api_key)

            prompt = STEEL_MAN_GENERATOR_PROMPT.format(
                claims=json.dumps(claims, ensure_ascii=False),
                biases=json.dumps(detected_biases, ensure_ascii=False),
                perspectives=json.dumps(perspectives[:3], ensure_ascii=False),  # Limit for context
                sources=json.dumps(verified_sources[:2], ensure_ascii=False),  # Limit for context
            )

            response = await client.aio.models.generate_content(
                model=settings.gemini_model_pro,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.7,
                ),
            )

            logger.info(f"[Aggregate] Steel Man response received: {response.text[:200]}...")
            result = extract_json(response.text)
            if result:
                steel_man = {
                    "opposing_argument": result.get("opposingArgument", ""),
                    "strengthened_argument": result.get("strengthenedArgument", ""),
                    "refutation_points": result.get("refutationPoints", []),
                }
                logger.info(f"[Aggregate] Steel Man generated successfully with {len(steel_man.get('refutation_points', []))} refutation points")
            else:
                logger.warning("[Aggregate] Failed to parse Steel Man JSON")

        except Exception as e:
            logger.error(f"[Aggregate] Steel Man generation failed: {e}")
    else:
        logger.warning("[Aggregate] No data available for Steel Man generation")

    return {
        "steel_man": steel_man,
        "agent_statuses": [
            {
                "agent_id": "system",
                "status": "done",
                "message": "Analysis complete",
                "progress": 100,
            }
        ]
    }
