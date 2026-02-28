"""SSE event types for real-time streaming."""

from typing import Literal, Optional, Union

from pydantic import BaseModel, Field

from .agent import AgentState


class AgentStatusEvent(BaseModel):
    """Event for agent status updates."""

    type: Literal["agent_status"] = "agent_status"
    payload: AgentState = Field(..., description="Agent state update")


class PanelUpdatePayload(BaseModel):
    """Payload for panel updates."""

    data: dict = Field(default_factory=dict, description="Panel-specific data")


class PanelUpdateEvent(BaseModel):
    """Event for panel data updates."""

    type: Literal["panel_update"] = "panel_update"
    panel: Literal["source", "perspective", "bias"] = Field(
        ..., description="Panel being updated"
    )
    payload: dict = Field(default_factory=dict, description="Panel data")


class AnalysisCompletePayload(BaseModel):
    """Payload for analysis completion."""

    session_id: str = Field(..., description="Session identifier")
    overall_trust_score: int = Field(default=0, description="Overall trust score")
    summary: Optional[str] = Field(None, description="Analysis summary")


class AnalysisCompleteEvent(BaseModel):
    """Event when analysis is complete."""

    type: Literal["analysis_complete"] = "analysis_complete"
    payload: dict = Field(default_factory=dict, description="Completion data")


class ErrorPayload(BaseModel):
    """Payload for error events."""

    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    agent_id: Optional[str] = Field(None, description="Agent that caused the error")


class ErrorEvent(BaseModel):
    """Event for errors during analysis."""

    type: Literal["error"] = "error"
    payload: dict = Field(default_factory=dict, description="Error details")


SSEEvent = Union[AgentStatusEvent, PanelUpdateEvent, AnalysisCompleteEvent, ErrorEvent]
