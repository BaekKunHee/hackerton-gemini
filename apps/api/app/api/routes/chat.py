"""Socrates dialogue endpoint"""
import json
from fastapi import APIRouter, HTTPException
from google import genai
from google.genai import types

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.session import session_store
from app.agents.prompts import SOCRATES_PROMPT
from app.core.config import settings

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def socrates_chat(request: ChatRequest):
    """Socrates dialogue endpoint."""
    session = session_store.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    context = session.conversation_context or {}
    current_step = context.get("step", 0)
    messages = context.get("messages", [])

    client = genai.Client(api_key=settings.gemini_api_key)

    # Build prompt with context
    prompt = SOCRATES_PROMPT.format(
        source_result=context.get("source_summary", ""),
        perspectives=context.get("perspective_summary", ""),
        biases=json.dumps(context.get("detected_biases", []), ensure_ascii=False),
        current_step=current_step + 1,
        previous_messages=json.dumps(messages, ensure_ascii=False),
        user_message=request.message
    )

    # Use Pro model for high-quality Socratic dialogue
    response = await client.aio.models.generate_content(
        model=settings.gemini_model_pro,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.8,
        )
    )

    # Update conversation context
    new_step = min(current_step + 1, 4)
    new_messages = messages + [
        {"role": "user", "content": request.message},
        {"role": "assistant", "content": response.text}
    ]

    session_store.update(
        request.session_id,
        conversation_context={
            **context,
            "step": new_step,
            "messages": new_messages
        }
    )

    return ChatResponse(
        response=response.text,
        step=new_step,
        is_complete=new_step >= 4
    )
