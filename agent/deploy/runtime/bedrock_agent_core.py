"""
Bedrock AgentCore Runtime Entrypoint
"""

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from agent.factory import create_agent

app = BedrockAgentCoreApp()


@app.entrypoint
async def integrated_disaster_agent(payload):
    """Handler for agent invocation"""
    userMessage = payload.get("prompt", "Hello! How can I assist you?")
    actorId = payload.get("actor_id", "default-user1")
    sessionId = payload.get("session_id", "default-session1")

    print(f"Processing request - actor: {actorId}, session: {sessionId}")

    agent = create_agent(actorId, sessionId)

    stream = agent.stream_async(userMessage)
    async for event in stream:
        yield event


if __name__ == "__main__":
    app.run()
