"""
Memory session management
"""

from bedrock_agentcore.memory.session import MemorySession, MemorySessionManager

from config import MEMORY_ID, REGION

# Global session manager (singleton)
_session_manager = None


def get_memory_session_manager() -> MemorySessionManager:
    """Get or create memory session manager"""
    global _session_manager
    if _session_manager is None:
        _session_manager = MemorySessionManager(memory_id=MEMORY_ID, region_name=REGION)
        print(f"✅ Session manager initialized for memory: {MEMORY_ID}")
    return _session_manager


def create_memory_session(actorId: str, sessionId: str) -> MemorySession:
    """Create a memory session for the given actor and session"""
    manager = get_memory_session_manager()
    session = manager.create_memory_session(
        actor_id=actorId,
        session_id=sessionId
    )
    print(f"🔧 Memory session created (actor: {actorId}, session: {sessionId})")
    return session
