"""Agent types and state schemas."""

from typing import Literal, Optional

from pydantic import BaseModel, Field

AgentId = Literal["analyzer", "source", "perspective", "socrates"]
AgentStatus = Literal["idle", "thinking", "searching", "analyzing", "done", "error"]


class AgentState(BaseModel):
    """Represents the current state of an AI agent."""

    agent_id: AgentId = Field(..., description="Unique identifier for the agent")
    status: AgentStatus = Field(..., description="Current status of the agent")
    message: Optional[str] = Field(None, description="Status message or description")
    progress: Optional[int] = Field(
        None, ge=0, le=100, description="Progress percentage (0-100)"
    )
