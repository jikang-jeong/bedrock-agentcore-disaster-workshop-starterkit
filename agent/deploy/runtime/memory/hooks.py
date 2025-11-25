"""
Memory hooks for Agent lifecycle events
"""

from bedrock_agentcore.memory import MemoryClient
from bedrock_agentcore.memory.constants import ConversationalMessage, MessageRole
from bedrock_agentcore.memory.session import MemorySessionManager
from strands.hooks import AgentInitializedEvent, AfterInvocationEvent, MessageAddedEvent, HookProvider, HookRegistry

from config import MEMORY_ID, REGION


class ShortTermMemoryHookProvider(HookProvider):
    def __init__(self, memory_session: MemorySessionManager):
        self.memory_session = memory_session

    def on_agent_initialized(self, event: AgentInitializedEvent):
        """에이전트 시작 시 최근 대화 기록을 로드합니다"""
        try:
            recent_turns = self.memory_session.get_last_k_turns(k=5)

            if recent_turns:
                context_messages = []
                for turn in recent_turns:
                    for message in turn:
                        if hasattr(message, 'role') and hasattr(message, 'content'):
                            role = message['role']
                            content = message['content']
                        else:
                            role = message.get('role', 'unknown')
                            content = message.get('content', {}).get('text', '')
                        
                        content_str = str(content)
                        context_messages.append(f"{role}: {content_str}")
                        print(f"📖 {role}: {content_str[:100]}...")

                context = "\n".join(context_messages)
                event.agent.system_prompt += f"\n\nRecent conversation:\n{context}"
                print(f"✅ {len(recent_turns)}개 대화 로드 완료")

        except Exception as e:
            print(f"❌ 메모리 로드 오류: {e}")

    def on_message_added(self, event: MessageAddedEvent):
        """메시지를 메모리에 저장합니다"""
        messages = event.agent.messages
        try:
            if messages and len(messages) > 0 and messages[-1]["content"][0].get("text"):
                message_text = messages[-1]["content"][0]["text"]
                message_role = MessageRole.USER if messages[-1]["role"] == "user" else MessageRole.ASSISTANT

                print(f"💾 {message_role.value}: {message_text[:100]}...")

                result = self.memory_session.add_turns(
                    messages=[ConversationalMessage(message_text, message_role)]
                )

                event_id = result['eventId']
                print(f"✅ 메시지 저장 완료 (Event ID: {event_id})")

        except Exception as e:
            print(f"❌ 메모리 저장 오류: {e}")

    def register_hooks(self, registry: HookRegistry):
        registry.add_callback(MessageAddedEvent, self.on_message_added)
        registry.add_callback(AgentInitializedEvent, self.on_agent_initialized)
        print("✅ 메모리 훅 등록 완료")


class LongTermMemoryHookProvider(HookProvider):
    """장기 메모리 관리 훅"""

    def __init__(self, memory_id: str, client: MemoryClient):
        self.memory_id = memory_id
        self.client = client

    def retrieve_memories(self, event: MessageAddedEvent):
        """사용자 메시지 처리 전 관련 메모리를 검색합니다"""
        messages = event.agent.messages
        if messages[-1]["role"] == "user" and "toolResult" not in messages[-1]["content"][0]:
            user_message = messages[-1]["content"][0].get("text", "")

            try:
                actor_id = event.agent.state.get("actor_id")
                if not actor_id:
                    print("❌ actor_id 없음")
                    return

                namespace = f"/actors/{actor_id}"
                print(f"🔍 메모리 검색: {user_message[:100]}...")

                memories = self.client.retrieve_memories(
                    memory_id=self.memory_id,
                    namespace=namespace,
                    query=user_message
                )

                memory_context = []
                for memory in memories:
                    if isinstance(memory, dict):
                        content = memory.get('content', {})
                        if isinstance(content, dict):
                            text = content.get('text', '').strip()
                            if text:
                                memory_context.append(text)
                                print(f"📖 {text[:100]}...")

                if memory_context:
                    context_text = "\n".join(memory_context)
                    original_text = messages[-1]["content"][0].get("text", "")
                    messages[-1]["content"][0]["text"] = (
                        f"{original_text}\n\nPrevious context: {context_text}"
                    )
                    print(f"✅ {len(memory_context)}개 메모리 검색 완료")
                else:
                    print("ℹ️ 검색된 메모리 없음")

            except Exception as e:
                print(f"❌ 메모리 검색 실패: {e}")

    def save_memories(self, event: AfterInvocationEvent):
        """에이전트 응답 후 대화를 저장합니다"""
        try:
            messages = event.agent.messages
            if len(messages) >= 2 and messages[-1]["role"] == "assistant":
                user_msg = None
                assistant_msg = None

                for msg in reversed(messages):
                    if msg["role"] == "assistant" and not assistant_msg:
                        assistant_msg = msg["content"][0]["text"]
                    elif msg["role"] == "user" and not user_msg and "toolResult" not in msg["content"][0]:
                        user_msg = msg["content"][0]["text"]
                        break

                if user_msg and assistant_msg:
                    actor_id = event.agent.state.get("actor_id")
                    session_id = event.agent.state.get("session_id")

                    if not actor_id or not session_id:
                        print("❌ actor_id 또는 session_id 없음")
                        return

                    print(f"💾 장기 메모리 저장: {user_msg[:50]}...")

                    result = self.client.create_event(
                        memory_id=self.memory_id,
                        actor_id=actor_id,
                        session_id=session_id,
                        messages=[(user_msg, "USER"), (assistant_msg, "ASSISTANT")]
                    )
                    print(f"✅ 장기 메모리 저장 완료")

        except Exception as e:
            print(f"❌ 장기 메모리 저장 실패: {e}")

    def register_hooks(self, registry: HookRegistry) -> None:
        registry.add_callback(MessageAddedEvent, self.retrieve_memories)
        registry.add_callback(AfterInvocationEvent, self.save_memories)
        print("✅ 장기 메모리 훅 등록 완료")
