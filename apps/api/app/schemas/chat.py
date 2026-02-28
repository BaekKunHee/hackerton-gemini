"""Chat request and response schemas for Socrates dialogue."""

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request for Socrates dialogue."""

    session_id: str = Field(..., description="Analysis session identifier")
    message: str = Field(..., description="User's message")


class ChatResponse(BaseModel):
    """Response from Socrates dialogue."""

    response: str = Field(..., description="Socrates' response")
    step: int = Field(..., ge=1, le=4, description="Current dialogue step (1-4)")
    is_complete: bool = Field(..., description="Whether the dialogue is complete")
