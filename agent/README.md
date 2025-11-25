# 🤖 재난 대응 AI 에이전트 백엔드

AWS Bedrock AgentCore 기반 화재 대응 지휘 에이전트

## 📚 개요

이 백엔드는 Flask 서버와 Bedrock AgentCore 런타임으로 구성되어 있습니다.

### 구성 요소
- **Flask 서버** (`main.py`) - Frontend와 AgentCore 사이의 프록시
- **AgentCore 런타임** (`deploy/runtime/`) - 실제 에이전트 로직
- **도구 모음** (`tool_use/`) - 에이전트가 사용하는 도구들
- **메모리 관리** (`memory/`) - 대화 컨텍스트 유지

---

## 🚀 빠른 시작


### 1.  환경 설정
```python
# deploy/runtime/config.py
MODEL_ID = "global.anthropic.claude-sonnet-4-5-20250929-v1:0"
REGION = "us-west-2"
MEMORY_ID = "customMemory-XXXXX"  # 본인의 Memory ID
WINDY_API_KEY = "YOUR_WINDY_KEY"

```

### 2. 의존성 설치
```bash
cd agent
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```


### 3. 서버 실행
```bash
python main.py
# 서버 실행: http://localhost:8082
```

---

## 🛠️ 도구 추가 가이드

### 1. 도구 함수 작성

```python
# deploy/runtime/tool_use/disaster_tools.py
from strands import tool
from typing import Dict, Any

@tool
def my_custom_tool(param: str) -> Dict[str, Any]:
    """도구 설명 (에이전트가 이 설명을 보고 도구를 선택함)
    
    Args:
        param: 파라미터 설명
        
    Returns:
        결과를 담은 딕셔너리
    """
    try:
        # 도구 로직 구현
        result = f"처리 결과: {param}"
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
```

### 2. 에이전트에 등록

```python
# deploy/runtime/agent/factory.py
from tool_use.disaster_tools import my_custom_tool

def create_agent(actorId: str, sessionId: str) -> Agent:
    agent = Agent(
        name=AGENT_NAME,
        model=model,
        system_prompt=AGENT_SYSTEM_PROMPT,
        hooks=[...],
        tools=[
            browser_tool_agent,
            wikipedia,
            find_fire_station,
            get_weather_info,
            my_custom_tool  # 추가
        ],
        state={"actor_id": actorId, "session_id": sessionId}
    )
    return agent
```

---

## 📖 기존 도구 설명

### 1. wikipedia
```python
@tool
def wikipedia(query: str) -> Dict[str, Any]:
    """위키피디아에서 정보를 검색합니다."""
```

**사용 예시:**
- "화재 진압 방법에 대해 알려줘" → 위키피디아 검색

---

### 2. find_fire_station
```python
@tool
def find_fire_station(address: str) -> str:
    """주소를 기반으로 가장 가까운 소방서를 벡터 검색으로 찾습니다."""
```

**동작 방식:**
1. 주소를 Titan Embeddings로 임베딩
2. S3 Vectors에서 코사인 유사도 검색
3. 가장 가까운 소방서 반환

**사용 예시:**
- "서울특별시 강남구에서 가장 가까운 소방서는?" → 벡터 검색

---

### 3. get_weather_info
```python
@tool
def get_weather_info(latitude: float, longitude: float) -> str:
    """Windy API를 사용해 기상 정보를 조회합니다."""
```

**반환 정보:**
- 온도 (°C)
- 풍속 (m/s)
- 풍향 (도)
- 습도 (%)
- 기압 (hPa)

**사용 예시:**
- "위도 37.5, 경도 127.0의 날씨는?" → Windy API 호출

---

### 4. browser_tool_agent
```python
# Playwright 기반 웹 브라우징 에이전트
```

**기능:**
- 뉴스 사이트 검색
- 교통 정보 수집
- 지역 이슈 파악

**사용 예시:**
- "강남구 화재 관련 뉴스 찾아줘" → 웹 브라우징

---

## 🧠 메모리 관리

### Short-term Memory
현재 세션의 대화 내용을 저장합니다.

```python
# memory/hooks.py
class ShortTermMemoryHookProvider:
    def __init__(self, userSession):
        self.userSession = userSession
```

### Long-term Memory
과거 세션의 중요 정보를 저장합니다.

```python
# memory/hooks.py
class LongTermMemoryHookProvider:
    def __init__(self, memory_id, memory_client):
        self.memory_id = memory_id
        self.memory_client = memory_client
```

### Memory 생성
```bash
cd deploy/memory
python deploy.py
```

---

## 🔧 설정 파일

### config.py
```python
# 모델 설정
MODEL_ID = "global.anthropic.claude-sonnet-4-5-20250929-v1:0"
REGION = "us-west-2"

# 메모리 설정
MEMORY_ID = "customMemory-XXXXX"

# API 설정
WINDY_API_KEY = "YOUR_KEY"
WINDY_API_URL = "https://api.windy.com/api/point-forecast/v2"

# 에이전트 설정
AGENT_NAME = "FireCommandAssistant"
AGENT_SYSTEM_PROMPT = """..."""

# 브라우저 도구 설정
BROWSER_MODEL_ID = "global.anthropic.claude-haiku-4-5-20251001-v1:0"
BROWSER_SYSTEM_PROMPT = """..."""
``` 

## 📁 디렉토리 구조

```
agent/
├── main.py                    # Flask 서버
├── requirements.txt           # Python 의존성
├── README.md                  # 이 문서
└── deploy/
    ├── runtime/
    │   ├── bedrock_agent_core.py      # AgentCore 엔트리포인트
    │   ├── config.py                  # 설정
    │   ├── requirements.txt           # 런타임 의존성
    │   ├── Dockerfile                 # Docker 이미지
    │   ├── .bedrock_agentcore.yaml    # AgentCore 설정
    │   ├── agent/
    │   │   └── factory.py             # 에이전트 팩토리
    │   ├── memory/
    │   │   ├── hooks.py               # 메모리 훅
    │   │   └── manager.py             # 메모리 관리자
    │   └── tool_use/
    │       ├── disaster_tools.py      # 재난 대응 도구
    │       └── browser_tool/
    │           └── playwright.py      # 웹 브라우징 도구
    └── memory/
        └── deploy.py                  # Memory 생성 스크립트
```
 
