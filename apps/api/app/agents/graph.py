"""
Flipside LangGraph State and Graph Definition

Graph Flow:
START -> Analyzer(A) -> [Source(B) | Perspective(C) | Socrates Init(D)] -> Aggregate -> END
                        (parallel execution)
"""

import operator
from typing import Annotated, Literal, Optional

from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END


# ====================
# Type Definitions
# ====================

class Claim(TypedDict):
    """A claim extracted from the content."""
    id: int
    text: str
    evidence: str
    sources: list[str]


class DetectedBias(TypedDict):
    """A detected bias pattern."""
    type: str
    confidence: float
    example: str


class OriginalSource(TypedDict):
    """Original source information."""
    url: str
    title: str
    publisher: str
    date: str
    relevant_quote: str


class Verification(TypedDict):
    """Verification result for a source."""
    status: str  # 'verified' | 'distorted' | 'context_missing' | 'unverifiable'
    explanation: str
    comparison: dict[str, str]


class VerifiedSource(TypedDict):
    """A verified source with analysis."""
    original_claim: str
    original_source: OriginalSource
    verification: Verification
    trust_score: int


class SourceInfo(TypedDict):
    """Source information for a perspective."""
    url: str
    title: str
    publisher: str


class SpectrumPosition(TypedDict):
    """Position on various spectrums."""
    political: float
    emotional: float
    complexity: float


class Perspective(TypedDict):
    """A perspective on the analyzed content."""
    id: int
    source: SourceInfo
    main_claim: str
    frame: str
    key_points: list[str]
    spectrum: SpectrumPosition


class DivergencePoint(TypedDict):
    """A point where perspectives diverge."""
    topic: str
    positions: dict[str, str]


class AgentStatusUpdate(TypedDict):
    """Status update from an agent."""
    agent_id: str
    status: str  # 'idle' | 'thinking' | 'searching' | 'analyzing' | 'done' | 'error'
    message: Optional[str]
    progress: Optional[int]


# ====================
# Main Graph State
# ====================

class FlipsideState(TypedDict):
    """
    Main state for the Flipside analysis graph.

    Uses Annotated with operator.add for append-only fields
    to support parallel execution accumulation.
    """

    # Input (required)
    session_id: str
    content_type: str  # 'url' | 'text' | 'image'
    content: str

    # Agent A (Analyzer) Output
    claims: list[Claim]
    logic_structure: str
    detected_biases: list[DetectedBias]
    source_verifier_instructions: dict
    perspective_instructions: dict

    # Agent B (Source Verifier) Output
    verified_sources: list[VerifiedSource]
    overall_trust_score: int
    source_summary: str

    # Agent C (Perspective Explorer) Output
    perspectives: list[Perspective]
    common_facts: list[str]
    divergence_points: list[DivergencePoint]
    perspective_summary: str
    perspective_image: Optional[dict]

    # Agent D (Socrates) Output
    socrates_ready: bool
    conversation_context: dict

    # Aggregate Output
    steel_man: Optional[dict]

    # Status tracking (append-only for parallel nodes)
    agent_statuses: Annotated[list[AgentStatusUpdate], operator.add]

    # Error tracking (append-only)
    errors: Annotated[list[dict], operator.add]


def get_initial_state(
    session_id: str,
    content_type: str,
    content: str
) -> FlipsideState:
    """Create initial state for a new analysis session."""
    return FlipsideState(
        # Input
        session_id=session_id,
        content_type=content_type,
        content=content,

        # Agent A outputs (will be filled)
        claims=[],
        logic_structure="",
        detected_biases=[],
        source_verifier_instructions={},
        perspective_instructions={},

        # Agent B outputs
        verified_sources=[],
        overall_trust_score=0,
        source_summary="",

        # Agent C outputs
        perspectives=[],
        common_facts=[],
        divergence_points=[],
        perspective_summary="",
        perspective_image=None,

        # Agent D outputs
        socrates_ready=False,
        conversation_context={},

        # Aggregate outputs
        steel_man=None,

        # Tracking
        agent_statuses=[],
        errors=[]
    )


# ====================
# Graph Builder
# ====================

def create_flipside_graph():
    """
    Create the main Flipside analysis graph.

    Graph structure:
    - START: Entry point
    - analyzer: Agent A - parses content, extracts claims, detects biases
    - source_verifier: Agent B - verifies sources (parallel)
    - perspective_explorer: Agent C - finds alternative views (parallel)
    - socrates_init: Agent D - prepares dialogue context (parallel)
    - aggregate_results: Combines all results
    - END: Exit point
    """
    from app.agents.nodes.analyzer import analyzer_node
    from app.agents.nodes.source_verifier import source_verifier_node
    from app.agents.nodes.perspective import perspective_explorer_node
    from app.agents.nodes.socrates import socrates_init_node
    from app.agents.nodes.aggregate import aggregate_results_node

    builder = StateGraph(FlipsideState)

    # Add nodes
    builder.add_node("analyzer", analyzer_node)
    builder.add_node("source_verifier", source_verifier_node)
    builder.add_node("perspective_explorer", perspective_explorer_node)
    builder.add_node("socrates_init", socrates_init_node)
    builder.add_node("aggregate_results", aggregate_results_node)

    # Define edges
    # START -> Analyzer
    builder.add_edge(START, "analyzer")

    # Analyzer -> Parallel execution of B, C, D
    # LangGraph automatically runs these in parallel since they
    # all originate from the same source and don't depend on each other
    builder.add_edge("analyzer", "source_verifier")
    builder.add_edge("analyzer", "perspective_explorer")
    builder.add_edge("analyzer", "socrates_init")

    # All parallel nodes -> Aggregate
    builder.add_edge("source_verifier", "aggregate_results")
    builder.add_edge("perspective_explorer", "aggregate_results")
    builder.add_edge("socrates_init", "aggregate_results")

    # Aggregate -> END
    builder.add_edge("aggregate_results", END)

    return builder.compile()


# Pre-compiled graph instance (for reuse)
_flipside_graph = None


def get_flipside_graph():
    """Get or create the compiled graph."""
    global _flipside_graph
    if _flipside_graph is None:
        _flipside_graph = create_flipside_graph()
    return _flipside_graph
