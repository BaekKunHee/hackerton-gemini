"""Aggregate Results Node - Generates Steel Man analysis"""
import asyncio
import json
from google import genai
from google.genai import types
from app.core.config import settings
from app.agents.prompts import STEEL_MAN_GENERATOR_PROMPT, EXPANDED_TOPICS_PROMPT
from app.agents.utils import extract_json


async def aggregate_results_node(state: dict) -> dict:
    """
    Aggregates results from all parallel agents.
    Generates Steel Man analysis with refutation points.
    Generates expanded topics and related content.
    """
    print("[AGGREGATE] Node called!", flush=True)

    claims = state.get("claims", [])
    detected_biases = state.get("detected_biases", [])
    perspectives = state.get("perspectives", [])
    verified_sources = state.get("verified_sources", [])

    print(f"[AGGREGATE] claims={len(claims)}, biases={len(detected_biases)}, perspectives={len(perspectives)}", flush=True)

    steel_man = None
    expanded_topics = []
    related_content = []

    # Generate Steel Man and Expanded Topics in parallel
    if claims or detected_biases or perspectives:
        try:
            print("[AGGREGATE] Calling Gemini for Steel Man and Expanded Topics...", flush=True)
            client = genai.Client(api_key=settings.gemini_api_key)

            # Steel Man prompt
            steel_man_prompt = STEEL_MAN_GENERATOR_PROMPT.format(
                claims=json.dumps(claims, ensure_ascii=False),
                biases=json.dumps(detected_biases, ensure_ascii=False),
                perspectives=json.dumps(perspectives[:3], ensure_ascii=False),
                sources=json.dumps(verified_sources[:2], ensure_ascii=False),
            )

            # Expanded Topics prompt
            expanded_prompt = EXPANDED_TOPICS_PROMPT.format(
                claims=json.dumps(claims, ensure_ascii=False),
                biases=json.dumps(detected_biases, ensure_ascii=False),
                perspectives=json.dumps(perspectives[:3], ensure_ascii=False),
            )

            # Run both API calls in parallel
            steel_man_task = client.aio.models.generate_content(
                model=settings.gemini_model_pro,
                contents=steel_man_prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.7,
                ),
            )

            # Use Flash model with Google Search for related content
            expanded_task = client.aio.models.generate_content(
                model=settings.gemini_model_flash,
                contents=expanded_prompt,
                config=types.GenerateContentConfig(
                    tools=[types.Tool(google_search=types.GoogleSearch())],
                    temperature=0.7,
                ),
            )

            steel_man_response, expanded_response = await asyncio.gather(
                steel_man_task, expanded_task, return_exceptions=True
            )

            # Process Steel Man response
            if not isinstance(steel_man_response, Exception):
                print(f"[AGGREGATE] Steel Man response: {steel_man_response.text[:100]}...", flush=True)
                result = extract_json(steel_man_response.text)
                if result:
                    steel_man = {
                        "opposing_argument": result.get("opposingArgument", ""),
                        "strengthened_argument": result.get("strengthenedArgument", ""),
                        "refutation_points": result.get("refutationPoints", []),
                    }
                    print(f"[AGGREGATE] Steel Man created with {len(steel_man.get('refutation_points', []))} points", flush=True)
            else:
                print(f"[AGGREGATE] Steel Man ERROR: {steel_man_response}", flush=True)

            # Process Expanded Topics response
            if not isinstance(expanded_response, Exception):
                print(f"[AGGREGATE] Expanded Topics response: {expanded_response.text[:100]}...", flush=True)
                expanded_result = extract_json(expanded_response.text)
                if expanded_result:
                    expanded_topics = expanded_result.get("expandedTopics", [])
                    related_content = expanded_result.get("relatedContent", [])
                    print(f"[AGGREGATE] Expanded: {len(expanded_topics)} topics, {len(related_content)} content", flush=True)
            else:
                print(f"[AGGREGATE] Expanded Topics ERROR: {expanded_response}", flush=True)

        except Exception as e:
            print(f"[AGGREGATE] ERROR: {e}", flush=True)
            import traceback
            traceback.print_exc()
    else:
        print("[AGGREGATE] No data for Steel Man", flush=True)

    print(f"[AGGREGATE] Returning steel_man={steel_man is not None}, expanded={len(expanded_topics)}", flush=True)

    return {
        "steel_man": steel_man,
        "expanded_topics": expanded_topics,
        "related_content": related_content,
        "agent_statuses": [
            {
                "agent_id": "system",
                "status": "done",
                "message": "Analysis complete",
                "progress": 100,
            }
        ]
    }
