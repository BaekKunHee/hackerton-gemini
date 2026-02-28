"""Agent D: Socrates (Dynamic Question Generation)"""
import json
import logging
from google import genai
from google.genai import types
from app.core.config import settings
from app.agents.prompts import SOCRATES_QUESTION_GENERATOR_PROMPT
from app.agents.utils import extract_json

logger = logging.getLogger(__name__)


# Default fallback questions (Korean)
DEFAULT_QUESTIONS = [
    "이 주장에서 가장 말이 안 된다고 느낀 부분이 어디예요?",
    "원본 데이터를 보니까 어떤 생각이 들어요?",
    "다른 관점 중에서 가장 일리 있다고 생각하는 건 뭐예요?",
    "처음이랑 지금, 생각이 달라진 부분이 있어요?",
]


async def socrates_init_node(state: dict) -> dict:
    """
    Agent D: Socrates Init
    - Generates dynamic questions based on analysis results
    - Prepares conversation context for dialogue
    """

    claims = state.get("claims", [])
    detected_biases = state.get("detected_biases", [])
    perspectives = state.get("perspectives", [])

    # Prepare perspectives summary for prompt
    perspectives_summary = [
        {
            "id": p.get("id"),
            "main_claim": p.get("main_claim", ""),
            "frame": p.get("frame", ""),
        }
        for p in perspectives
    ]

    questions = DEFAULT_QUESTIONS
    question_contexts = []

    logger.info(f"[Socrates] Starting question generation with {len(claims)} claims, {len(detected_biases)} biases, {len(perspectives)} perspectives")

    # Only generate dynamic questions if we have analysis data
    if claims or detected_biases or perspectives:
        try:
            client = genai.Client(api_key=settings.gemini_api_key)

            prompt = SOCRATES_QUESTION_GENERATOR_PROMPT.format(
                claims=json.dumps(claims, ensure_ascii=False),
                biases=json.dumps(detected_biases, ensure_ascii=False),
                perspectives=json.dumps(perspectives_summary, ensure_ascii=False),
            )

            response = await client.aio.models.generate_content(
                model=settings.gemini_model_pro,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.7,
                ),
            )

            result = extract_json(response.text)
            if result and "questions" in result:
                generated_questions = result.get("questions", [])
                if len(generated_questions) >= 4:
                    questions = [q["question"] for q in generated_questions]
                    question_contexts = generated_questions

        except Exception as e:
            # Fallback to default questions if generation fails
            logger.exception(f"[Socrates] Question generation failed: {e}")
            questions = DEFAULT_QUESTIONS

    conversation_context = {
        "session_id": state["session_id"],
        "step": 0,
        "claims": claims,
        "detected_biases": detected_biases,
        "perspectives": perspectives,
        "messages": [],
        "questions": questions,
        "question_contexts": question_contexts,
    }

    return {
        "socrates_ready": True,
        "conversation_context": conversation_context,
        "agent_statuses": [
            {
                "agent_id": "socrates",
                "status": "thinking",
                "message": "Preparing dialogue questions...",
                "progress": 50,
            },
            {
                "agent_id": "socrates",
                "status": "done",
                "message": "Ready for dialogue",
                "progress": 100,
            },
        ],
    }
