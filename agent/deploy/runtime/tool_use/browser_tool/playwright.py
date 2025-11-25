"""
브라우저 도구 에이전트
"""
from strands import tool
from strands import Agent
from strands_tools.browser import AgentCoreBrowser
from config import BROWSER_MODEL_ID, BROWSER_SYSTEM_PROMPT


def create_agent():
    agent_core_browser = AgentCoreBrowser(region="us-west-2")

    agent = Agent(
        tools=[agent_core_browser.browser],
        model=BROWSER_MODEL_ID,
        system_prompt=BROWSER_SYSTEM_PROMPT
    )
    return agent

@tool
def browser_tool_agent(prompt: str):
    """소방 대응 지휘를 위한 지역 상황을 다음 웹사이트를 호출,방문해 정보를 수집합니다.
    visit web site: https://news.google.com/search?q={prompt}&hl=ko&gl=KR&ceid=KR%3Ako
    이때 q parameter는 prompt를 입력하는데 아래의 규칙을 따른다.
    prompt 처리:
    - "서울특별시 강남구 남부순환로 06284" → "서울특별시 강남구"
    - 번지와 도로명 제거, 시/구 단위로 검색
    
    Args:
        prompt: 검색할 지역과 수집할 정보 유형
    
    Returns:
        검색 결과 종합 정보 (기사 제목, 업데이트 시간, 기사 출처)
    """
    try:
        strands_agent = create_agent()
        print(f"✅ 브라우저 도구 실행: {prompt}")
        response = strands_agent(prompt)

        return response.message["content"][0]["text"] if response.message.get("content") else str(response)

    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        return f"오류 발생: {str(e)}"
