"""
Agent factory for creating configured agents
"""

from strands import Agent
from strands.models import BedrockModel

from bedrock_agentcore.memory import MemoryClient
from config import MODEL_ID, AGENT_NAME, AGENT_SYSTEM_PROMPT, MEMORY_ID, REGION
from memory.hooks import ShortTermMemoryHookProvider, LongTermMemoryHookProvider
from memory.manager import create_memory_session
from tool_use.disaster_tools import wikipedia, find_fire_station, get_weather_info
from tool_use.browser_tool.playwright import browser_tool_agent


def create_agent(actorId: str, sessionId: str) -> Agent:
    """메모리와 도구가 설정된 에이전트를 생성합니다"""
    userSession = create_memory_session(actorId, sessionId)
    memory_client = MemoryClient(region_name=REGION)
    model = BedrockModel(model_id=MODEL_ID)
    
    agent = Agent(
        name=AGENT_NAME,
        model=model,
        system_prompt=AGENT_SYSTEM_PROMPT,
        hooks=[
            ShortTermMemoryHookProvider(userSession),
            LongTermMemoryHookProvider(MEMORY_ID, memory_client)
        ],
        tools=[browser_tool_agent, wikipedia, find_fire_station, get_weather_info],
        state={"actor_id": actorId, "session_id": sessionId}
    )
    
    print(f"✅ 에이전트 생성 완료 (actor: {actorId}, session: {sessionId})")
    return agent
