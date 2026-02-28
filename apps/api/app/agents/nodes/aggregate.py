"""Aggregate Results Node"""


async def aggregate_results_node(state: dict) -> dict:
    """
    Aggregates results from all parallel agents.
    This node runs after all parallel agents complete.
    """

    # All data is already in state from parallel nodes
    # Just mark completion
    return {
        "agent_statuses": [
            {
                "agent_id": "system",
                "status": "done",
                "message": "Analysis complete",
                "progress": 100,
            }
        ]
    }
