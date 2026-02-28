"""Pydantic schemas for Flipside API."""

from .agent import AgentId, AgentState, AgentStatus
from .analyze import (
    AnalysisResult,
    AnalyzeRequest,
    AnalyzeResponse,
    Claim,
    DetectedBias,
    DivergencePoint,
    OriginalSource,
    Perspective,
    SourceInfo,
    SpectrumPosition,
    Verification,
    VerifiedSource,
)
from .chat import ChatRequest, ChatResponse
from .events import (
    AgentStatusEvent,
    AnalysisCompleteEvent,
    AnalysisCompletePayload,
    ErrorEvent,
    ErrorPayload,
    PanelUpdateEvent,
    PanelUpdatePayload,
    SSEEvent,
)

__all__ = [
    # Agent types
    "AgentId",
    "AgentStatus",
    "AgentState",
    # Analysis types
    "AnalyzeRequest",
    "AnalyzeResponse",
    "Claim",
    "DetectedBias",
    "OriginalSource",
    "Verification",
    "VerifiedSource",
    "SourceInfo",
    "SpectrumPosition",
    "Perspective",
    "DivergencePoint",
    "AnalysisResult",
    # Chat types
    "ChatRequest",
    "ChatResponse",
    # Event types
    "AgentStatusEvent",
    "PanelUpdateEvent",
    "PanelUpdatePayload",
    "AnalysisCompleteEvent",
    "AnalysisCompletePayload",
    "ErrorEvent",
    "ErrorPayload",
    "SSEEvent",
]
