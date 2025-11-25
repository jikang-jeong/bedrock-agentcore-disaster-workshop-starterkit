# 🔥 재난 대응 AI 에이전트 Hands-on Lab

AWS Bedrock AgentCore를 활용한 화재 대응 어시스턴트 시스템 실습 프로젝트

## 📚 개요

이 프로젝트는 화재 발생 시 AI 에이전트가 실시간으로 상황을 분석하고 대응 전략을 제시하는 시스템입니다.

### 주요 기능
- 🗺️ **실시간 화재 위치 시각화** - Leaflet 기반 인터랙티브 지도
- 🤖 **AI 에이전트 분석** - Bedrock AgentCore 기반 상황 분석
- 🚒 **소방서 검색** - S3 Vectors 벡터 검색으로 최근접 소방서 탐색
- 🌤️ **기상 정보 연동** - Windy API 실시간 풍속/풍향 데이터
- 💬 **대화형 메모리** - Bedrock Memory로 컨텍스트 유지
- 📰 **뉴스 수집** - Playwright 기반 웹 브라우징

### 아키텍처
```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  Frontend   │─────▶│ Flask Server │─────▶│ Bedrock Agent   │
│  (Browser)  │      │  (main.py)   │      │   AgentCore     │
└─────────────┘      └──────────────┘      └─────────────────┘
                                                     │
                     ┌───────────────────────────────┼───────────────┐
                     │                               │               │
              ┌──────▼──────┐              ┌────────▼────────┐  ┌──▼──────┐
              │ S3 Vectors  │              │ Bedrock Memory  │  │ Windy   │
              │ (소방서 DB)  │              │  (대화 기록)     │  │   API   │
              └─────────────┘              └─────────────────┘  └─────────┘
```

---

## 🎯 사전 준비

### Windy API 키 발급 (필수)

화재 현장의 실시간 기상 정보(풍속, 풍향, 온도 등)를 조회하기 위해 필요합니다.

**발급 절차:**
1. https://api.windy.com 접속
2. 회원가입 (무료)
3. API 키 발급 (Free tier: 하루 500 requests)
4. Lab 1에서 `.env` 파일에 자동 설정됨

---

## 🚀 실습 가이드

이 워크샵은 **7개의 Jupyter Notebook**으로 구성되어 있으며, 순차적으로 진행합니다.

### Lab 1: 환경 구성
**파일:** `lab1_environment_setup.ipynb`

**내용:**
- Python 패키지 설치
- AWS 환경 확인
- `.env` 파일 생성 및 Windy API Key 설정

**생성 파일:**
- `.env` (AWS Region, Windy API Key)

---

### Lab 2: Memory 구성
**파일:** `lab2_memory_setup.ipynb`

**내용:**
- Bedrock Agent Core Memory 생성
- Short-term & Long-term Memory 이해
- Semantic Strategy 설정

**생성 리소스:**
- Bedrock Memory (customMemory)
- Memory ID → `.env`에 자동 저장

---

### Lab 3: Vector Database 구성
**파일:** `lab3_vector_database.ipynb`

**내용:**
- S3 Vector Bucket 생성
- Vector Index 생성
- 소방서 데이터 임베딩 (Titan Embeddings)
- Vector Search 테스트

**생성 리소스:**
- S3 Vector Bucket: `firestation-location-xy`
- Vector Index: `fire-station`
- 임베딩된 소방서 데이터 (~1,200개)

**데이터 소스:**
- `misc/fire_station.csv` (전국 소방서 좌표)

---

### Lab 4: Agent 생성
**파일:** `lab4_create_agent.ipynb`

**내용:**
- Agent Factory 구현
- Memory Hooks 구현 (Short-term & Long-term)
- Memory Manager 구현

**생성 파일:**
- `agent/deploy/runtime/agent/factory.py`
- `agent/deploy/runtime/memory/hooks.py`
- `agent/deploy/runtime/memory/manager.py`

---

### Lab 5: Tools 생성
**파일:** `lab5_create_tools.ipynb`

**내용:**
- Disaster Tools 구현
  - `wikipedia`: 위키피디아 검색
  - `find_fire_station`: 소방서 벡터 검색
  - `get_weather_info`: Windy API 기상 정보
- Browser Tool 구현 (Playwright)
- Agent Factory에 Tools 등록

**생성 파일:**
- `agent/deploy/runtime/config.py`
- `agent/deploy/runtime/tool_use/disaster_tools.py`
- `agent/deploy/runtime/tool_use/browser_tool/playwright.py`

---

### Lab 6: Agent Runtime 배포
**파일:** `lab6_agent_runtime.ipynb`

**내용:**
- `bedrock_agent_core.py` 생성 (Entrypoint)
- `requirements.txt` 생성
- Docker 이미지 빌드 및 ECR 배포
- S3 Vectors 권한 추가

**생성 리소스:**
- Bedrock Agent Core Runtime
- ECR Repository
- Docker Image
- Execution Role (S3 Vectors 권한 포함)
- Agent ARN → `.env`에 자동 저장

**소요 시간:** 5-10분 (Docker 빌드)

---

### Lab 7: 웹 애플리케이션 연동
**파일:** `lab7_web_application.ipynb`

**내용:**
- Flask API 서버 생성 (`agent/main.py`)
- `env.js` 파일 자동 생성 (Frontend 설정)
- HTTP 서버 스크립트 생성
- 전체 시스템 테스트

**생성 파일:**
- `agent/main.py` (Flask 서버)
- `env.js` (Frontend 환경 변수)
- `start_server.sh` (Flask 실행 스크립트)
- `start_http_server.sh` (HTTP 서버 실행 스크립트)

**실행 방법:**
```bash
# 터미널 1: Flask 서버
./start_server.sh

# 터미널 2: HTTP 서버
./start_http_server.sh
```

**접근 주소:**
- 로컬: http://localhost:8000
- SageMaker Studio: `https://{studio-domain}/jupyter/default/proxy/8000/`

---

## 📝 중요 사항

### 1. 환경 변수 관리
- **모든 설정은 `.env` 파일에 자동 저장됩니다**
- `env.js`는 Lab 7에서 자동 생성되므로 **수동 설정 불필요**
- Windy API Key만 Lab 1에서 입력하면 됩니다

### 2. 파일 생성
- `agent/` 디렉토리의 모든 파일은 **노트북 실행으로 자동 생성**됩니다
- 수동으로 파일을 생성하거나 수정할 필요가 없습니다

### 3. 순차 실행
- Lab 1 → Lab 2 → ... → Lab 7 순서대로 진행해야 합니다
- 각 Lab은 이전 Lab의 결과물에 의존합니다

### 4. SageMaker Studio 사용 시
- Lab 7에서 Studio 도메인 입력 필요
- `env.js`에 프록시 URL이 자동 설정됩니다

---

## 🧪 테스트 쿼리

워크샵 완료 후 다음 쿼리로 시스템을 테스트하세요:

```
서울특별시 서초구 방배중앙로 06681에서 화재가 발생했습니다. 
가까운 소방서를 찾아주세요.
```

**예상 결과:**
- ✅ 가까운 소방서 5곳 표시
- ✅ 지도에 마커 표시
- ✅ 기상 정보 (풍속, 풍향, 온도)
- ✅ 관련 뉴스 (Browser Tool)

---

## 🚀 빠른 시작 (워크샵 완료 후)

워크샵을 완료한 후 시스템을 재실행하는 방법:

### 1. 서버 실행

#### Backend (Flask)
```bash
./start_server.sh
# 또는
cd agent && python main.py
```

#### Frontend (HTTP Server)
```bash
./start_http_server.sh
# 또는
python3 -m http.server 8000
```

### 2. 접근

**로컬 환경:**
- Frontend: http://localhost:8000
- Backend: http://localhost:8082

**SageMaker Studio:**
- Frontend: `https://{studio-domain}/jupyter/default/proxy/8000/`
- Backend: `https://{studio-domain}/jupyter/default/proxy/8082/`

### 3. 사용 방법

1. 브라우저에서 Frontend 접속
2. 지도에서 화재 발생 지점 클릭 (마커 생성)
3. 🤖 "AI 에이전트 분석" 버튼 클릭
4. 우측 패널에서 실시간 분석 결과 확인


---

## 🛠️ 개발 가이드 (고급)

### Frontend 커스터마이징

#### 지도 설정 변경
```javascript
// map-config.js
const MAP_CONFIG = {
    mapCenter: [37.5, 127.5],  // 지도 중심 좌표
    mapZoom: 11,               // 초기 줌 레벨
    timeInterval: 30,          // 시간 간격 (분)
    layers: {
        standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        humanitarian: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    }
};
```

#### 화재 마커 아이콘 변경
```javascript
// app.js
const fireIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,...',  // SVG 아이콘
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});
```

---

### Backend 도구 추가

새로운 도구를 에이전트에 추가하는 방법입니다.

#### 1. 도구 함수 작성
```python
# agent/deploy/runtime/tool_use/disaster_tools.py
from strands import tool

@tool
def my_custom_tool(param: str) -> str:
    """도구 설명
    Args:
        param: 파라미터 설명
    Returns:
        결과 설명
    """
    # 도구 로직
    return "결과"
```

#### 2. 에이전트에 등록
```python
# agent/deploy/runtime/agent/factory.py
from tool_use.disaster_tools import my_custom_tool

agent = Agent(
    tools=[browser_tool, wikipedia, find_fire_station, get_weather_info, my_custom_tool],
    # ...
)
```

---

### 에이전트 프롬프트 수정

에이전트의 행동을 변경하려면 시스템 프롬프트를 수정합니다.

```python
# agent/deploy/runtime/agent/factory.py
AGENT_SYSTEM_PROMPT = """당신은 소방서 화재 대응 지휘를 지원하는 전문 AI 어시스턴트입니다.

**대상 사용자:** 소방서 지휘관 및 대응팀

**핵심 임무:**
1. 화재 현장의 전술적 정보 제공
2. 신속한 의사결정 지원
3. 대응 자원 배치 최적화 제안

**절대 규칙:**
1. 모든 응답은 한글로 작성
2. 도구 사용 시 목적과 결과를 명시
3. 소방서 검색 시 반드시 <event type="geocode">위도,경도,소방서이름</event> 형식 반환
...
"""
```

---

## 📖 API 문서

### Agent API

**Endpoint:** `POST /analyze`

**Request:**
```json
{
  "prompt": "화재 발생 지점: 서울특별시 강남구\n위도: 37.5, 경도: 127.0\n\n화재가 발생했다!!!!!",
  "actor_id": "user-jikjeong",
  "session_id": "session-user-jikjeong-"
}
```

**Response:** (Server-Sent Events)
```
data: ### 🔥 화재 현장 분석\n\n**위치:** 서울특별시 강남구...
data: <event type="geocode">37.5123,127.0456,강남소방서</event>
data: <event type="windy">37.5,127.0,15.2,3.5,270,65,1013,서울특별시 강남구</event>
```

---

### Event 태그 시스템

에이전트가 특정 동작을 트리거하기 위해 사용하는 이벤트 태그입니다.

#### 1. geocode (소방서 마커 표시)
```xml
<event type="geocode">위도,경도,라벨</event>
```
**예시:**
```xml
<event type="geocode">37.5123,127.0456,강남소방서</event>
```

#### 2. windy (기상 정보 패널 표시)
```xml
<event type="windy">위도,경도,온도,풍속,풍향,습도,기압,주소</event>
```
**예시:**
```xml
<event type="windy">37.5,127.0,15.2,3.5,270,65,1013,서울특별시 강남구</event>
```

#### 3. address (주소 지오코딩)
```xml
<event type="address">주소</event>
```
**예시:**
```xml
<event type="address">서울특별시 강남구 테헤란로 123</event>
```

---

## 📁 프로젝트 구조

```
disaster_starter_kit/
├── lab1_environment_setup.ipynb      # Lab 1: 환경 구성
├── lab2_memory_setup.ipynb           # Lab 2: Memory 구성
├── lab3_vector_database.ipynb        # Lab 3: Vector Database
├── lab4_create_agent.ipynb           # Lab 4: Agent 생성
├── lab5_create_tools.ipynb           # Lab 5: Tools 생성
├── lab6_agent_runtime.ipynb          # Lab 6: Runtime 배포
├── lab7_web_application.ipynb        # Lab 7: 웹 애플리케이션
├── .env                               # 환경 변수 (자동 생성)
├── index.html                         # UI 레이아웃
├── app.js                             # 핵심 로직
├── map-config.js                      # 지도 설정
├── env.js                             # Frontend 환경 변수 (자동 생성)
├── README.md                          # 이 문서
├── agent/                             # 백엔드 (자동 생성)
│   ├── main.py                       # Flask 서버
│   └── deploy/
│       └── runtime/                  # Bedrock AgentCore 런타임
│           ├── bedrock_agent_core.py
│           ├── config.py
│           ├── requirements.txt
│           ├── agent/
│           │   └── factory.py
│           ├── memory/
│           │   ├── manager.py
│           │   └── hooks.py
│           └── tool_use/
│               ├── disaster_tools.py
│               └── browser_tool/
│                   └── playwright.py
└── misc/
    └── fire_station.csv              # 소방서 데이터
```

---

## 🔧 트러블슈팅

### 1. S3 Vectors 권한 오류
```
AccessDeniedException: User is not authorized to perform: s3vectors:QueryVectors
```

**해결 방법:**
- Lab 6에서 자동으로 권한이 추가됩니다
- 수동 추가: `lab4_s3vectors_permission.py` 실행

### 2. Memory ID 오류
```
ResourceNotFoundException: Memory not found
```

**해결 방법:**
- Lab 2를 다시 실행하여 Memory 생성
- `.env` 파일에 `MEMORY_ID`가 올바르게 설정되었는지 확인

### 3. Flask 서버 연결 오류
```
Failed to fetch: http://localhost:8082/analyze
```

**해결 방법:**
- Flask 서버가 실행 중인지 확인: `./start_server.sh`
- SageMaker Studio: `env.js`의 프록시 URL 확인

### 4. Playwright 브라우저 오류
```
Executable doesn't exist at /path/to/chromium
```

**해결 방법:**
```bash
playwright install chromium
```

---

## 📚 참고 자료

- [AWS Bedrock Agent Core 문서](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [S3 Vectors 문서](https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vectors.html)
- [Windy API 문서](https://api.windy.com/api/docs)
- [Strands Framework](https://github.com/aws-samples/strands)

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

---

## 🤝 기여

이슈 및 풀 리퀘스트를 환영합니다!

---

## 📧 문의

질문이나 피드백은 이슈를 통해 남겨주세요.
 