"""
Flipside AI Agents Package
4 AI agents working together for critical thinking analysis
"""

from .prompts import (
    ANALYZER_PROMPT,
    SOURCE_VERIFIER_PROMPT,
    PERSPECTIVE_EXPLORER_PROMPT,
    SOCRATES_PROMPT,
    CONTENT_PARSER_PROMPT,
)

from .nodes import (
    analyzer_node,
    source_verifier_node,
    perspective_explorer_node,
    socrates_init_node,
    aggregate_results_node,
)

from .graph import (
    FlipsideState,
    get_initial_state,
    create_flipside_graph,
    get_flipside_graph,
)

__all__ = [
    # Prompts
    "ANALYZER_PROMPT",
    "SOURCE_VERIFIER_PROMPT",
    "PERSPECTIVE_EXPLORER_PROMPT",
    "SOCRATES_PROMPT",
    "CONTENT_PARSER_PROMPT",
    # Nodes
    "analyzer_node",
    "source_verifier_node",
    "perspective_explorer_node",
    "socrates_init_node",
    "aggregate_results_node",
    # Graph
    "FlipsideState",
    "get_initial_state",
    "create_flipside_graph",
    "get_flipside_graph",
]
