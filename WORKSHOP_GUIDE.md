# 🔥 Bedrock Agent Core 화재 대응 어시스턴트 워크샵 가이드

## 📋 워크샵 개요

### 목표
Strands Agent와 Bedrock Agent Core를 활용하여 화재 대응 지휘를 지원하는 AI 어시스턴트를 구축합니다.

### 소요 시간
약 2-3시간

### 난이도
중급 (Python, AWS 기본 지식 필요)

---

## 🎯 학습 목표

1. **Bedrock Agent Core Memory** 이해 및 활용
   - Short-term Memory vs Long-term Memory
   - Semantic Strategy 설정

2. **S3 Vectors** 를 활용한 벡터 검색
   - 임베딩 생성 (Titan Embed v2)
   - 유사도 기반 검색

3. **Strands Agent** 구축
   - Tool 정의 및 통합
   - Memory Hook 설정
   - Browser Tool 활용

4. **Bedrock Agent Core Runtime** 배포
   - Docker 컨테이너화
   - ECR 배포
   - 서버리스 실행

5. **Frontend 통합**
   - Flask API 서버
   - 실시간 스트리밍
   - 지도 시각화

---

## 🛠️ 사전 준비

### 1. AWS 계정 및 권한

필요한 AWS 서비스 권한:
- Amazon Bedrock (모델 액세스)
- S3 및 S3 Vectors
- ECR (Elastic Container Registry)
- IAM (Role 생성)
- CloudWatch Logs

### 2. 개발 환경

- **Python**: 3.9 이상
- **Docker**: 최신 버전 (Runtime 배포용)
- **AWS CLI**: 설정 완료
- **SageMaker Jupyter Notebook** 또는 로컬 Jupyter

### 3. API Key 발급

#### Windy API Key
1. https://api.windy.com 접속
2. 무료 계정 생성
3. API Key 발급
4. `env.js` 파일에 저장

```javascript
const ENV = {
    WINDY_API_KEY: 'YOUR_API_KEY_HERE',
    // ...
};
```

### 4. 필요한 파일 확인

```
disaster_starter_kit/
├── agent/
│   ├── deploy/
│   │   ├── memory/
│   │   │   └── deploy.py
│   │   └── runtime/
│   │       ├── bedrock_agent_core.py
│   │       ├── config.py
│   │       ├── deploy.py
│   │       └── requirements.txt
│   └── main.py
├── s3vector_embed/
│   └── embed_firestation.py
├── misc/
│   └── 소방청_전국소방서 좌표현황(XY좌표)_20240901.csv
├── index.html
├── env.js
└── workshop_bedrock_agent_core.ipynb  # 이번에 생성한 파일
```

---

## 📚 워크샵 진행 순서

### Step 1: 환경 설정 (15분)

1. Jupyter Notebook 열기
2. 필요한 패키지 설치
3. AWS 계정 확인

```python
!pip install strands-agents bedrock-agentcore bedrock-agentcore-starter-toolkit
```

### Step 2: Memory 생성 (20분)

#### Memory 개념 이해

**Short-term Memory**
- 현재 대화 세션 내에서만 유지
- 빠른 응답 속도
- 대화 흐름 유지

**Long-term Memory**
- 세션을 넘어 영구 저장
- Semantic Search 지원
- 사용자별 개인화

**Semantic Strategy**
- Vector 임베딩 기반
- 의미적으로 유사한 정보 자동 검색
- Namespace로 사용자별 격리

#### 실습

```python
from bedrock_agentcore_starter_toolkit.operations.memory.manager import MemoryManager
from bedrock_agentcore_starter_toolkit.operations.memory.models.strategies import SemanticStrategy

memory_manager = MemoryManager(region_name="us-west-2")

memory = memory_manager.get_or_create_memory(
    name="customMemory",
    description="화재 대응 어시스턴트 메모리 저장소",
    strategies=[
        SemanticStrategy(
            name="semanticLongTermMemory",
            namespaces=['/actors/{actorId}'],
        )
    ],
    event_expiry_days=30
)

MEMORY_ID = memory.get('id')
print(f"Memory ID: {MEMORY_ID}")
```

**⚠️ 중요**: Memory ID를 `agent/deploy/runtime/config.py`에 저장하세요!

### Step 3: S3 Vector Database 생성 (15분)

#### S3 Vectors란?

- S3에 벡터 데이터 저장
- 유사도 검색 지원
- 서버리스 아키텍처

#### 실습

```python
s3vectors = boto3.client('s3vectors', region_name='us-west-2')

# Vector Index 생성
s3vectors.create_index(
    vectorBucketName="firestation-location-xy",
    indexName="fire-station",
    vectorDimensions=1024,  # Titan Embed v2
    vectorDataType="float32"
)
```

### Step 4: 소방서 데이터 임베딩 (30분)

#### 임베딩이란?

텍스트를 숫자 벡터로 변환하여:
- 의미적 유사도 계산 가능
- 주소 기반 검색 가능
- 거리 계산 없이 가까운 소방서 검색

#### 사용 모델

- **Amazon Titan Embed Text v2**
- 1024 차원
- 한국어 지원

#### 실습

```python
# CSV 읽기
df = pd.read_csv('misc/소방청_전국소방서 좌표현황(XY좌표)_20240901.csv', encoding='euc-kr')

# 각 소방서 정보를 임베딩으로 변환
for idx, row in df.iterrows():
    text = f"{row['소방서 및 안전센터명']} , 위치: {row['주소']} ..."
    
    # Bedrock으로 임베딩 생성
    response = bedrock.invoke_model(
        modelId="amazon.titan-embed-text-v2:0",
        body=json.dumps({
            "inputText": text,
            "dimensions": 1024,
            "normalize": True
        })
    )
    
    # S3 Vectors에 저장
    s3vectors.put_vectors(...)
```

**예상 소요 시간**: 약 10-15분 (데이터 크기에 따라)

### Step 5: Agent Runtime 배포 (30분)

#### Runtime 배포 과정

1. Agent 코드 패키징
2. ECR 리포지토리 생성
3. Docker 이미지 빌드
4. Runtime 생성

#### 실습

```python
from bedrock_agentcore_starter_toolkit import Runtime

agentcore_runtime = Runtime()

# Runtime 설정
agentcore_runtime.configure(
    entrypoint="bedrock_agent_core.py",
    auto_create_execution_role=True,
    auto_create_ecr=True,
    requirements_file="requirements.txt",
    region="us-west-2",
    agent_name="agent_runtime"
)

# 배포
launch_result = agentcore_runtime.launch(auto_update_on_conflict=True)

print(f"Agent ARN: {launch_result.agent_arn}")
```

**⚠️ 중요**: Agent ARN을 `agent/main.py`에 저장하세요!

**예상 소요 시간**: 약 5-10분

### Step 6: Flask 서버 실행 (10분)

#### Flask 서버의 역할

- Frontend와 Agent Runtime 연결
- `/analyze` 엔드포인트 제공
- 스트리밍 응답 처리

#### 실습

```bash
cd agent
python main.py
```

서버가 `http://localhost:8082`에서 실행됩니다.

### Step 7: Frontend 테스트 (20분)

#### 테스트 시나리오

1. **env.js 확인**
   ```javascript
   const ENV = {
       WINDY_API_KEY: 'YOUR_KEY',
       AGENT_API_URL: 'http://localhost:8082/analyze',
   };
   ```

2. **index.html 열기**
   - 브라우저에서 직접 열기
   - 또는 Live Server 사용

3. **테스트 쿼리**
   ```
   서울특별시 서초구 방배중앙로 06681에서 화재가 발생했습니다. 
   가까운 소방서를 찾아주세요.
   ```

4. **예상 결과**
   - ✅ 가까운 소방서 5곳 표시
   - ✅ 지도에 마커 표시
   - ✅ 기상 정보 (풍속, 풍향, 온도)
   - ✅ 관련 뉴스 (Browser Tool)

---

## 🔍 주요 기능 설명

### 1. find_fire_station Tool

```python
@tool
def find_fire_station(address: str) -> str:
    """화재 발생 시 주소를 기반으로 가까운 소방서 5곳을 벡터 검색으로 찾습니다."""
    # 1. 주소를 임베딩으로 변환
    # 2. S3 Vectors로 유사도 검색
    # 3. 상위 5개 소방서 반환
```

**특징**:
- 거리 계산 없이 의미 기반 검색
- 주소 표현의 다양성 처리
- 빠른 응답 속도

### 2. get_weather_info Tool

```python
@tool
def get_weather_info(latitude: float, longitude: float) -> str:
    """Windy API를 사용해 기상 정보를 조회합니다."""
    # 1. Windy API 호출
    # 2. 풍속, 풍향, 온도, 습도, 기압 계산
    # 3. 좌표를 주소로 변환
```

**특징**:
- 실시간 기상 정보
- 화재 확산 예측에 중요
- 대응 전략 수립 지원

### 3. browser_tool_agent

```python
browser_tool_agent = Agent(
    name="BrowserToolAgent",
    model=BedrockModel(model_id="claude-haiku-4-5"),
    tools=[browser_tool],
    system_prompt="뉴스 수집 전문 에이전트"
)
```

**특징**:
- Playwright 기반 웹 검색
- 화재 관련 뉴스 수집
- 교통, 날씨, 사회 이슈 파악

### 4. Memory Hooks

```python
hooks=[
    ShortTermMemoryHookProvider(userSession),
    LongTermMemoryHookProvider(MEMORY_ID, memory_client)
]
```

**Short-term Hook**:
- 대화 컨텍스트 자동 저장
- 이전 대화 참조 가능

**Long-term Hook**:
- 중요 정보 영구 저장
- 과거 대응 사례 검색

---

## 🐛 문제 해결

### Memory ID를 잃어버렸어요

```python
from bedrock_agentcore_starter_toolkit.operations.memory.manager import MemoryManager

memory_manager = MemoryManager(region_name="us-west-2")
memories = memory_manager.list_memories()

for memory in memories:
    print(f"ID: {memory.get('id')}, Name: {memory.get('name')}")
```

### Vector 검색이 안 돼요

1. **Index 상태 확인**
   ```python
   s3vectors.describe_index(
       vectorBucketName="firestation-location-xy",
       indexName="fire-station"
   )
   ```

2. **데이터 확인**
   - 임베딩이 제대로 저장되었는지 확인
   - Step 4 재실행

### Agent 호출이 안 돼요

1. **Agent ARN 확인**
   - `agent/main.py`의 `agentRuntimeArn` 확인
   - Step 5에서 생성된 ARN과 일치하는지 확인

2. **Runtime 상태 확인**
   ```python
   bedrock_agentcore = boto3.client('bedrock-agentcore')
   response = bedrock_agentcore.get_agent_runtime(
       agentRuntimeArn='YOUR_ARN'
   )
   print(response['status'])
   ```

### Flask 서버 오류

1. **포트 충돌**
   ```bash
   # 포트 8082가 사용 중인지 확인
   lsof -i :8082
   
   # 다른 포트 사용
   # main.py에서 포트 변경
   app.run(host='0.0.0.0', port=8083)
   ```

2. **CORS 오류**
   - `flask-cors` 설치 확인
   - `CORS(app)` 설정 확인

### Windy API 오류

1. **API Key 확인**
   - `config.py`의 `WINDY_API_KEY` 확인
   - https://api.windy.com 에서 키 상태 확인

2. **Rate Limit**
   - 무료 플랜: 하루 1000 요청
   - 초과 시 다음 날까지 대기

---

## 📊 아키텍처 다이어그램

```
┌─────────────┐
│  Frontend   │
│ (index.html)│
└──────┬──────┘
       │ HTTP POST /analyze
       ▼
┌─────────────┐
│   Flask     │
│   Server    │
│ (main.py)   │
└──────┬──────┘
       │ invoke_agent_runtime
       ▼
┌─────────────────────────────────┐
│  Bedrock Agent Core Runtime     │
│  ┌───────────────────────────┐  │
│  │  Strands Agent            │  │
│  │  ┌─────────────────────┐  │  │
│  │  │ Memory Hooks        │  │  │
│  │  │ - Short-term        │  │  │
│  │  │ - Long-term         │  │  │
│  │  └─────────────────────┘  │  │
│  │  ┌─────────────────────┐  │  │
│  │  │ Tools               │  │  │
│  │  │ - find_fire_station │  │  │
│  │  │ - get_weather_info  │  │  │
│  │  │ - wikipedia         │  │  │
│  │  │ - browser_tool      │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  S3 Vectors │   │   Windy API │
│  (소방서)    │   │  (기상정보)  │
└─────────────┘   └─────────────┘
```

---

## 🎓 추가 학습 자료

### AWS 공식 문서
- [Amazon Bedrock](https://docs.aws.amazon.com/bedrock/)
- [Bedrock Agent Core](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [S3 Vectors](https://docs.aws.amazon.com/s3/)

### GitHub 리포지토리
- [Strands Agents](https://github.com/aws-samples/strands-agents)
- [Bedrock Agent Core Starter Toolkit](https://github.com/aws-samples/bedrock-agentcore-starter-toolkit)

### 블로그 포스트
- [Building AI Agents with Bedrock](https://aws.amazon.com/blogs/machine-learning/)
- [Vector Search with S3](https://aws.amazon.com/blogs/storage/)

---

## 💡 확장 아이디어

### 1. 다중 언어 지원
- 영어, 일본어 등 추가
- 언어별 임베딩 모델 선택

### 2. 실시간 화재 감지
- IoT 센서 연동
- 자동 알림 시스템

### 3. 대응 시뮬레이션
- 과거 사례 기반 시뮬레이션
- 최적 대응 전략 추천

### 4. 모바일 앱
- React Native 또는 Flutter
- 푸시 알림 지원

### 5. 음성 인터페이스
- Amazon Transcribe 연동
- 핸즈프리 작동

---

## 📝 체크리스트

### 워크샵 시작 전
- [ ] AWS 계정 및 권한 확인
- [ ] Windy API Key 발급
- [ ] 필요한 파일 다운로드
- [ ] Python 환경 설정

### Step 2 완료 후
- [ ] Memory ID 복사
- [ ] config.py에 Memory ID 저장

### Step 4 완료 후
- [ ] Vector 검색 테스트 성공
- [ ] 소방서 5곳 정상 출력

### Step 5 완료 후
- [ ] Agent ARN 복사
- [ ] main.py에 Agent ARN 저장

### Step 7 완료 후
- [ ] Frontend 정상 작동
- [ ] 지도에 마커 표시
- [ ] 기상 정보 출력
- [ ] 뉴스 정보 출력

---

## 🙋 FAQ

**Q: SageMaker Notebook에서 실행해야 하나요?**
A: 아니요. 로컬 Jupyter Notebook에서도 실행 가능합니다. 단, Docker가 설치되어 있어야 합니다.

**Q: 비용은 얼마나 드나요?**
A: 주요 비용:
- Bedrock 모델 호출: 토큰당 과금
- S3 Vectors: 저장 및 쿼리 비용
- ECR: 이미지 저장 비용
워크샵 진행 시 약 $5-10 예상

**Q: 다른 지역(Region)에서도 가능한가요?**
A: 네. 단, Bedrock과 S3 Vectors가 지원되는 리전이어야 합니다.

**Q: 소방서 데이터를 업데이트하려면?**
A: CSV 파일을 교체하고 Step 4를 다시 실행하세요.

**Q: Memory를 삭제하려면?**
A: 
```python
memory_manager.delete_memory(memory_id=MEMORY_ID)
```

---

## 📞 지원

문제가 발생하면:
1. 이 가이드의 "문제 해결" 섹션 확인
2. CloudWatch Logs 확인
3. GitHub Issues 등록

---

**워크샵을 즐기세요! 🎉**
