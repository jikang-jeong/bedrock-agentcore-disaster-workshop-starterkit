from bedrock_agentcore_starter_toolkit.operations.memory.manager import MemoryManager
from bedrock_agentcore.memory.session import MemorySessionManager
from bedrock_agentcore.memory.constants import ConversationalMessage, MessageRole
from bedrock_agentcore_starter_toolkit.operations.memory.models.strategies import SemanticStrategy

region = "us-west-2"
memory_manager = MemoryManager(region_name=region)

print("Creating memory resource...")

memory = memory_manager.get_or_create_memory(
    name="customMemory",
    description="Customer support memory store",
    strategies=[
        SemanticStrategy(
            name="semanticLongTermMemory",
            namespaces=['/actors/{actorId}'],
        )
    ],
    event_expiry_days= 30
)

print(f"Memory ID: {memory.get('id')}")

# python -m venv .venv
# source .venv/bin/activate
# pip install bedrock-agentcore
# pip install bedrock-agentcore-starter-toolkit
