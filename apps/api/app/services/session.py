"""Session management service for Flipside analysis sessions."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel
import asyncio
from collections import defaultdict


class AnalysisSession(BaseModel):
    """Represents an analysis session for content verification."""

    id: str
    created_at: datetime
    content_type: str  # "url" | "text" | "image"
    content: str
    status: str = "pending"  # "pending" | "analyzing" | "done" | "error"
    result: Optional[dict] = None
    conversation_context: Optional[dict] = None


class SessionStore:
    """In-memory session store for MVP. Replace with Redis for production."""

    def __init__(self):
        self._sessions: dict[str, AnalysisSession] = {}
        self._subscribers: dict[str, list[asyncio.Queue]] = defaultdict(list)

    def create(self, session_id: str, content_type: str, content: str) -> AnalysisSession:
        """Create a new analysis session."""
        session = AnalysisSession(
            id=session_id,
            created_at=datetime.now(),
            content_type=content_type,
            content=content
        )
        self._sessions[session_id] = session
        return session

    def get(self, session_id: str) -> Optional[AnalysisSession]:
        """Get a session by ID."""
        return self._sessions.get(session_id)

    def update(self, session_id: str, **kwargs) -> Optional[AnalysisSession]:
        """Update session attributes."""
        session = self._sessions.get(session_id)
        if session:
            for key, value in kwargs.items():
                setattr(session, key, value)
        return session

    def subscribe(self, session_id: str) -> asyncio.Queue:
        """Subscribe to session events (for SSE)."""
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers[session_id].append(queue)
        return queue

    def unsubscribe(self, session_id: str, queue: asyncio.Queue):
        """Unsubscribe from session events."""
        if session_id in self._subscribers:
            try:
                self._subscribers[session_id].remove(queue)
            except ValueError:
                pass

    async def publish(self, session_id: str, event: dict):
        """Publish event to all subscribers of a session."""
        if session_id in self._subscribers:
            for queue in self._subscribers[session_id]:
                await queue.put(event)

    def delete(self, session_id: str):
        """Delete a session."""
        self._sessions.pop(session_id, None)
        self._subscribers.pop(session_id, None)


# Global session store instance
session_store = SessionStore()
