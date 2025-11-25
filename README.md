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

## 🎯 사전 준비 (필수)

### 1. Windy API 키 발급

화재 현장의 실시간 기상 정보(풍속, 풍향, 온도 등)를 조회하기 위해 필요합니다.

**발급 절차:**
1. https://api.windy.com 접속
2. 회원가입 (무료)
3. API 키 발급 (Free tier: 하루 500 requests)
4. `env.js` 파일의 `WINDY_API_KEY`에 입력

```javascript
// env.js
WINDY_API_KEY: 'YOUR_WINDY_API_KEY_HERE'
```

---

### 2. AWS S3 Vectors 설정 (소방서 데이터)

전국 소방서 위치 데이터를 벡터 임베딩하여 저장합니다.

**사전 요구사항:**
- AWS 계정
- S3 Vectors 버킷 생성 권한
- Bedrock 모델 액세스 (Titan Embeddings)

**설정 절차:**

#### 2.1 S3 Vectors 버킷 생성
```bash
aws s3vectors create-vector-bucket \
  --vector-bucket-name firestation-location-xy \
  --region us-west-2
```

#### 2.2 인덱스 생성
```bash
aws s3vectors create-index \
  --vector-bucket-name firestation-location-xy \
  --index-name fire-station \
  --vector-dimension 1024 \
  --distance-metric COSINE \
  --region us-west-2
```

#### 2.3 소방서 데이터 임베딩
```bash
cd s3vector_embed
pip install boto3 pandas
python embed_firestation.py
```

**데이터 소스:**
- `misc/소방청_전국소방서 좌표현황(XY좌표)_20240901.csv`
- 전국 소방서 약 1,200개 위치 정보

**임베딩 내용:**
```
소방서명, 주소, 위도, 경도, 전화번호 → Titan Embeddings (1024차원)
```

---

### 3. AWS Bedrock Memory 설정

에이전트의 대화 컨텍스트를 유지하기 위한 메모리 설정입니다.

**설정 절차:**

#### 3.1 Memory 생성
```bash
cd agent/deploy/memory
python deploy.py
```

또는 AWS Console에서:
1. Bedrock Console → Memory 메뉴
2. "Create Memory" 클릭
3. Memory ID 복사

#### 3.2 Memory ID 설정
```python
# agent/deploy/runtime/config.py
MEMORY_ID = "customMemory-XXXXX"  # 생성된 Memory ID로 변경
```

**Memory 구조:**
- Short-term Memory: 현재 세션의 대화 내용
- Long-term Memory: 과거 세션의 중요 정보

---

### 4. 환경 변수 설정

#### 4.1 Frontend 설정
```javascript
// env.js
const ENV = {
    USER_ID: 'your-user-id',           // 본인의 사용자 ID
    SESSION_ID: 'your-session-id-',    // 본인의 세션 ID
    WINDY_API_KEY: 'YOUR_WINDY_KEY',   // Windy API 키
    AGENT_API_URL: 'http://localhost:8082/analyze',
};
```

#### 4.2 Backend 설정
```python
# agent/deploy/runtime/config.py
MODEL_ID = "global.anthropic.claude-sonnet-4-5-20250929-v1:0"
REGION = "us-west-2"
MEMORY_ID = "customMemory-XXXXX"  # 본인의 Memory ID
WINDY_API_KEY = "YOUR_WINDY_KEY"  # Windy API 키
```

#### 4.3 Flask 서버 설정
```python
# agent/main.py
# agentRuntimeArn 수정 (본인의 ARN으로 변경)
agentRuntimeArn='arn:aws:bedrock-agentcore:us-west-2:YOUR_ACCOUNT:runtime/agent_runtime-XXXXX'
```

---

## 🚀 빠른 시작

### 1. 의존성 설치

#### Frontend
```bash
# 별도 설치 불필요 (CDN 사용)
```

#### Backend
```bash
cd agent
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 서버 실행

#### Backend (Flask)
```bash
cd agent
python main.py
# 서버 실행: http://localhost:8082
```

#### Frontend (HTTP Server)
프로젝트 루트 디렉토리에서 Python 내장 HTTP 서버를 실행합니다:

```bash
# 프로젝트 루트로 이동
cd disaster

# Python 3 HTTP 서버 실행
python3 -m http.server 8000

# 또는 Python 2
python -m SimpleHTTPServer 8000
```

**실행 확인:**
- 터미널에 `Serving HTTP on 0.0.0.0 port 8000 ...` 메시지 표시
- 브라우저에서 http://localhost:8000 접속

### 3. 사용 방법

1. 브라우저에서 `http://localhost:8000` 접속
2. 지도에서 화재 발생 지점 클릭 (마커 생성)
3. 🤖 "AI 에이전트 분석" 버튼 클릭
4. 우측 패널에서 실시간 분석 결과 확인

---

## 🛠️ 개발 가이드

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
    tools=[browser_tool_agent, wikipedia, find_fire_station, get_weather_info, my_custom_tool],
    # ...
)
```

---

### 에이전트 프롬프트 수정

에이전트의 행동을 변경하려면 시스템 프롬프트를 수정합니다.

```python
# agent/deploy/runtime/config.py
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
disaster/
├── index.html              # UI 레이아웃
├── app.js                  # 핵심 로직 (지도, 에이전트 연동)
├── map-config.js           # 지도 설정
├── env.js                  # 환경 변수 (API 키)
├── README.md               # 이 문서
├── agent/                  # 백엔드
│   ├── main.py            # Flask 서버
│   ├── requirements.txt   # Python 의존성
│   └── deploy/
│       ├── runtime/       # Bedrock AgentCore 런타임
│       │   ├── bedrock_agent_core.py
│       │   ├── config.py  # 에이전트 설정
│       │   ├── agent/factory.py
│       │   ├── memory/    # 메모리 관리
│       │   └── tool_use/  # 도구 모음
│       │       ├── disaster_tools.py
│       │       └── browser_tool/
│       └── memory/
│           └── deploy.py  # Memory 생성 스크립트
├── s3vector_embed/
│   └── embed_firestation.py  # 소방서 데이터 임베딩
└── misc/
    └── 소방청_전국소방서 좌표현황(XY좌표)_20240901.csv
```

---
 