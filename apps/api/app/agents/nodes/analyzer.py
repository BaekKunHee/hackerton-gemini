"""Agent A: Analyzer (Orchestrator)"""
import json
from google import genai
from google.genai import types
from app.core.config import settings
from app.agents.prompts import ANALYZER_PROMPT
from app.agents.utils import extract_json


async def analyzer_node(state: dict) -> dict:
    """
    Agent A: Analyzer
    - Parses content (URL/text/image)
    - Extracts 3 core claims with evidence
    - Detects bias patterns
    - Generates instructions for Agents B and C
    """

    client = genai.Client(api_key=settings.gemini_api_key)

    # Avoid str.format on JSON examples inside the prompt template.
    prompt = ANALYZER_PROMPT.replace("{content}", state["content"])

    # Use Pro model for complex reasoning and bias detection
    response = await client.aio.models.generate_content(
        model=settings.gemini_model_pro,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.7,
        ),
    )

    try:
        result = extract_json(response.text)
        if not result:
            # Fallback if JSON parsing fails
            result = {
                "claims": [],
                "logic_structure": response.text,
                "detected_biases": [],
                "agent_instructions": {},
            }

        return {
            "claims": result.get("claims", []),
            "logic_structure": result.get("logic_structure", ""),
            "detected_biases": result.get("detected_biases", []),
            "source_verifier_instructions": result.get("agent_instructions", {}).get(
                "source_verifier", {}
            ),
            "perspective_instructions": result.get("agent_instructions", {}).get(
                "perspective_explorer", {}
            ),
            "agent_statuses": [
                {
                    "agent_id": "analyzer",
                    "status": "thinking",
                    "message": "Analyzing content...",
                    "progress": 50,
                },
                {
                    "agent_id": "analyzer",
                    "status": "done",
                    "message": "Analysis complete",
                    "progress": 100,
                },
            ],
        }
    except Exception as e:
        return {
            "claims": [],
            "logic_structure": "",
            "detected_biases": [],
            "source_verifier_instructions": {},
            "perspective_instructions": {},
            "agent_statuses": [
                {
                    "agent_id": "analyzer",
                    "status": "error",
                    "message": f"Analyzer failed: {str(e)}",
                    "progress": 0,
                }
            ],
            "errors": [{"agent": "analyzer", "error": str(e)}],
        }
