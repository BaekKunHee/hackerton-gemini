"""Agent A: Analyzer (Orchestrator)"""
import re
import asyncio
import logging
from google import genai
from google.genai import types
from app.core.config import settings
from app.agents.prompts import ANALYZER_PROMPT
from app.agents.utils import extract_json

logger = logging.getLogger(__name__)

_YOUTUBE_RE = re.compile(
    r'(?:https?://)?(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)([^&\s?#]+)'
)


def _is_youtube_url(url: str) -> bool:
    return bool(_YOUTUBE_RE.search(url))


def _is_url(content_type: str) -> bool:
    return content_type == "url"


def _build_contents(content: str, content_type: str, prompt_text: str):
    """Build Gemini contents: multimodal Part for YouTube URLs, plain text otherwise."""
    if content_type == "url" and _is_youtube_url(content):
        # Pass the YouTube URL as a file_data Part so Gemini can actually
        # watch/read the video instead of guessing from the URL string.
        return [
            types.Part(file_data=types.FileData(file_uri=content, mime_type="video/*")),
            types.Part(text=prompt_text),
        ]
    return prompt_text


async def analyzer_node(state: dict) -> dict:
    """
    Agent A: Analyzer
    - Parses content (URL/text/image)
    - Extracts 3 core claims with evidence
    - Detects bias patterns
    - Generates instructions for Agents B and C
    """

    client = genai.Client(api_key=settings.gemini_api_key)

    content = state["content"]
    content_type = state.get("content_type", "text")

    # Avoid str.format on JSON examples inside the prompt template.
    prompt_text = ANALYZER_PROMPT.replace("{content}", content)
    contents = _build_contents(content, content_type, prompt_text)

    logger.info(f"[Analyzer] Starting analysis for content (type={content_type}): {content[:100]}...")
    logger.debug(f"[Analyzer] Using model: {settings.gemini_model_pro}")
    if content_type == "url" and _is_youtube_url(content):
        logger.info("[Analyzer] YouTube URL detected – passing as multimodal Part")

    # For non-YouTube URLs, enable url_context so Gemini actually fetches
    # and reads the page content instead of guessing from the URL string.
    use_url_context = _is_url(content_type) and not _is_youtube_url(content)
    if use_url_context:
        logger.info("[Analyzer] Non-YouTube URL detected – enabling url_context tool")

    tools = [types.Tool(url_context=types.UrlContext)] if use_url_context else None
    # When tools (url_context) are active, response_mime_type may conflict,
    # so we only force JSON output when no tools are in use.
    config_kwargs: dict = {"temperature": 0.7}
    if tools:
        config_kwargs["tools"] = tools
    else:
        config_kwargs["response_mime_type"] = "application/json"

    try:
        # Prevent a single slow model call from blocking the whole graph.
        logger.info("[Analyzer] Calling Gemini API...")
        try:
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=settings.gemini_model_pro,
                    contents=contents,
                    config=types.GenerateContentConfig(**config_kwargs),
                ),
                timeout=120,
            )
        except TimeoutError:
            # Pro model timed out – fall back to flash for faster response
            logger.warning("[Analyzer] Pro model timed out, falling back to flash model")
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=settings.gemini_model_flash,
                    contents=contents,
                    config=types.GenerateContentConfig(**config_kwargs),
                ),
                timeout=60,
            )
        logger.info(f"[Analyzer] Gemini API response received, length: {len(response.text)}")
        logger.debug(f"[Analyzer] Raw response: {response.text[:500]}...")
        result = extract_json(response.text)
        if not result:
            # Fallback if JSON parsing fails
            result = {
                "claims": [],
                "logic_structure": response.text,
                "user_instincts": [],
                "information_biases": [],
                "detected_biases": [],
                "agent_instructions": {},
            }

        return {
            "claims": result.get("claims", []),
            "logic_structure": result.get("logic_structure", ""),
            "user_instincts": result.get("user_instincts", []),
            "information_biases": result.get("information_biases", []),
            # Legacy support: detected_biases for backward compatibility
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
    except TimeoutError:
        logger.error("[Analyzer] Request timed out after 60 seconds")
        return {
            "claims": [],
            "logic_structure": "",
            "user_instincts": [],
            "information_biases": [],
            "detected_biases": [],
            "source_verifier_instructions": {},
            "perspective_instructions": {},
            "agent_statuses": [
                {
                    "agent_id": "analyzer",
                    "status": "error",
                    "message": "Analyzer timed out",
                    "progress": 0,
                }
            ],
            "errors": [{"agent": "analyzer", "error": "timeout"}],
        }
    except Exception as e:
        logger.exception(f"[Analyzer] Unexpected error: {str(e)}")
        return {
            "claims": [],
            "logic_structure": "",
            "user_instincts": [],
            "information_biases": [],
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
