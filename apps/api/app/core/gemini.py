"""Gemini API client factory and utilities."""

from google import genai
from google.genai import types

from app.core.config import settings


def get_gemini_client() -> genai.Client:
    """Create and return a Gemini API client."""
    return genai.Client(api_key=settings.gemini_api_key)


async def generate_content(
    prompt: str,
    *,
    system_instruction: str | None = None,
    model: str | None = None,
) -> str:
    """Generate content using Gemini API.

    Args:
        prompt: The user prompt to send to the model.
        system_instruction: Optional system instruction for the model.
        model: Optional model name override. Defaults to settings.gemini_model.

    Returns:
        The generated text response.
    """
    client = get_gemini_client()
    model_name = model or settings.gemini_model

    config = types.GenerateContentConfig()
    if system_instruction:
        config.system_instruction = system_instruction

    response = await client.aio.models.generate_content(
        model=model_name,
        contents=prompt,
        config=config,
    )

    return response.text or ""


async def generate_with_search(
    prompt: str,
    *,
    system_instruction: str | None = None,
    model: str | None = None,
) -> types.GenerateContentResponse:
    """Generate content with Google Search grounding enabled.

    This function uses Google Search to ground the model's responses
    with real-time information from the web.

    Args:
        prompt: The user prompt to send to the model.
        system_instruction: Optional system instruction for the model.
        model: Optional model name override. Defaults to settings.gemini_model.

    Returns:
        The full GenerateContentResponse including grounding metadata.
    """
    client = get_gemini_client()
    model_name = model or settings.gemini_model

    # Configure with Google Search tool for grounding
    config = types.GenerateContentConfig(
        tools=[types.Tool(google_search=types.GoogleSearch())],
    )
    if system_instruction:
        config.system_instruction = system_instruction

    response = await client.aio.models.generate_content(
        model=model_name,
        contents=prompt,
        config=config,
    )

    return response


def extract_search_sources(response: types.GenerateContentResponse) -> list[dict]:
    """Extract search grounding sources from a response.

    Args:
        response: The GenerateContentResponse from generate_with_search.

    Returns:
        List of source dictionaries with 'title' and 'url' keys.
    """
    sources = []

    if not response.candidates:
        return sources

    candidate = response.candidates[0]
    grounding_metadata = getattr(candidate, "grounding_metadata", None)

    if grounding_metadata and hasattr(grounding_metadata, "grounding_chunks"):
        for chunk in grounding_metadata.grounding_chunks or []:
            if hasattr(chunk, "web") and chunk.web:
                sources.append({
                    "title": chunk.web.title or "",
                    "url": chunk.web.uri or "",
                })

    return sources
