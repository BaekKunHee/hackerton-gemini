"""Agent D: Socrates (Dialogue Initialization)"""


async def socrates_init_node(state: dict) -> dict:
    """
    Agent D: Socrates Init
    - Prepares conversation context for dialogue
    - Does NOT start actual conversation (that's via /api/chat)
    """

    conversation_context = {
        "session_id": state["session_id"],
        "step": 0,
        "claims": state.get("claims", []),
        "detected_biases": state.get("detected_biases", []),
        "messages": [],
        "questions": [
            "What part of this argument seems most questionable to you?",
            "Looking at the original sources, what do you think now?",
            "Which opposing viewpoint makes the most sense to you?",
            "Do you still feel the same way as when you started?",
        ],
    }

    return {
        "socrates_ready": True,
        "conversation_context": conversation_context,
        "agent_statuses": [
            {
                "agent_id": "socrates",
                "status": "done",
                "message": "Ready for dialogue",
                "progress": 100,
            }
        ],
    }
