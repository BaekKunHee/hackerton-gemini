"""Gemini API client factory and utilities."""

import base64
import json

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


async def generate_perspective_spectrum_image(
    topic: str,
    perspectives: list[dict],
    *,
    model: str | None = None,
) -> dict | None:
    """Generate a linear-spectrum infographic image for perspective positions.

    Returns:
        A dictionary with image metadata and base64 payload, or None on failure.
        Example: {"mime_type": "image/png", "base64_data": "...", "caption": "..."}
    """
    if not perspectives:
        return None

    client = get_gemini_client()
    compact_points = [
        {
            "publisher": p.get("source", {}).get("publisher", ""),
            "frame": p.get("frame", ""),
            "political": p.get("spectrum", {}).get("political", 0),
        }
        for p in perspectives[:8]
    ]

    prompt = (
        "Create a clean Korean infographic that visualizes opinion positions.\n"
        "Select the most suitable chart style automatically from: linear spectrum, 2D scatter map, or bubble chart.\n"
        "Use political value (-1 to 1) as the main placement signal.\n"
        "Style: modern editorial chart, white background, high contrast, no photorealism.\n"
        "Must keep labels readable in Korean, include a clear title, and include a compact legend.\n"
        "If linear spectrum is selected, use axis labels: 진보 (left), 중립 (center), 보수 (right).\n"
        f"Topic: {topic or '관점 스펙트럼'}\n"
        f"Data: {json.dumps(compact_points, ensure_ascii=False)}"
    )

    response = await client.aio.models.generate_content(
        model=model or settings.gemini_model_image,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"],
        ),
    )

    caption = response.text or ""
    if not response.candidates:
        return None

    for part in response.candidates[0].content.parts or []:
        inline_data = getattr(part, "inline_data", None)
        if inline_data and getattr(inline_data, "data", None):
            encoded = base64.b64encode(inline_data.data).decode("ascii")
            return {
                "mime_type": inline_data.mime_type or "image/png",
                "base64_data": encoded,
                "caption": caption,
            }

    return None
