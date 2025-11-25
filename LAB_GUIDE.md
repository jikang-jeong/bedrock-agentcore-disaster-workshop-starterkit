# 🔥 실습 가이드

## 📚 실습 개요

총 5개의 실습으로 구성되어 있으며, 각 실습은 독립적인 Jupyter Notebook으로 제공됩니다.

---

## 실습 1: 환경 구성 (15분)

**파일**: `lab1_environment_setup.ipynb`

### 목표
- Python 패키지 설치
- AWS 환경 확인
- Windy API Key 설정

### 주요 작업
1. 필수 패키지 설치 (strands-agents, bedrock-agentcore 등)
2. Playwright 브라우저 설치
3. AWS 계정 및 Region 확인
4. Windy API Key 입력

### 완료 조건
- ✅ 모든 패키지 설치 완료
- ✅ AWS 계정 ID 출력 확인
- ✅ Windy API Key 설정 완료

---

## 실습 2: Memory 구성 (20분)

**파일**: `lab2_memory_setup.ipynb`

### 목표
- Bedrock Agent Core Memory 생성
- Short-term & Long-term Memory 이해
- Memory ID 저장

### 주요 개념
- **Short-term Memory**: 현재 대화 세션 내 컨텍스트 유지
- **Long-term Memory**: 세션을 넘어 영구 저장
- **Semantic Strategy**: Vector 임베딩 기반 유사 정보 검색

### 주요 작업
1. MemoryManager로 Memory 생성
2. SemanticStrategy 설정
3. Memory ID 획득
4. `config_memory.py` 파일 생성

### 완료 조건
- ✅ Memory ID 출력 확인
- ✅ `agent/deploy/runtime/config_memory.py` 파일 생성
- ✅ Memory 목록에서 생성된 Memory 확인

### ⚠️ 중요
**Memory ID를 반드시 복사하여 저장하세요!**

---

## 실습 3: Vector Database 구성 (30분)

**파일**: `lab3_vector_database.ipynb`

### 목표
- S3 Vector Database 생성
- 소방서 데이터 임베딩
- Vector Search 테스트

### 주요 개념
- **S3 Vectors**: S3에 벡터 데이터 저장 및 유사도 검색
- **임베딩**: 텍스트를 숫자 벡터로 변환
- **Titan Embed v2**: 1024차원, 한국어 지원

### 주요 작업
1. S3 Bucket 생성 (`firestation-location-xy`)
2. Vector Index 생성 (`fire-station`)
3. CSV 파일에서 소방서 데이터 로드
4. 각 소방서 정보를 임베딩으로 변환
5. S3 Vectors에 저장 (50개씩 배치)
6. 테스트 주소로 Vector Search 실행

### 완료 조건
- ✅ S3 Bucket 생성 확인
- ✅ Vector Index 생성 확인
- ✅ 전체 소방서 데이터 임베딩 완료
- ✅ 테스트 검색 시 5개 소방서 출력

### ⏱️ 예상 소요 시간
- 임베딩: 약 10-15분 (데이터 크기에 따라)

---

## 실습 4: Agent Runtime 구성 (30분)

**파일**: `lab4_agent_runtime.ipynb`

### 목표
- Agent 설정 파일 생성
- Bedrock Agent Core Runtime 배포
- Agent ARN 획득

### 주요 개념
- **Runtime**: Agent를 서버리스 환경에서 실행
- **Docker 컨테이너**: Agent 코드 패키징
- **ECR**: Docker 이미지 저장소

### 주요 작업
1. `config.py` 파일 생성 (Memory ID, Windy API Key 포함)
2. Runtime 디렉토리로 이동
3. Runtime 설정 및 배포
4. Docker 이미지 빌드 및 ECR 푸시
5. Agent ARN 획득
6. `agent_arn.txt` 파일 생성

### 완료 조건
- ✅ `agent/deploy/runtime/config.py` 파일 생성
- ✅ Runtime 배포 완료
- ✅ Agent ARN 출력 확인
- ✅ `agent_arn.txt` 파일 생성

### ⚠️ 중요
**Agent ARN을 반드시 복사하여 저장하세요!**

### ⏱️ 예상 소요 시간
- Docker 빌드 및 배포: 약 5-10분

---

## 실습 5: 웹 애플리케이션 연동 (20분)

**파일**: `lab5_web_application.ipynb`

### 목표
- Flask API 서버 생성
- Frontend 설정
- 전체 시스템 테스트

### 주요 작업
1. `agent/main.py` 파일 생성 (Flask 서버)
2. Agent ARN을 main.py에 자동 삽입
3. `env.js` 파일 업데이트
4. `start_server.sh` 스크립트 생성
5. Flask 서버 실행
6. Frontend 테스트

### 완료 조건
- ✅ `agent/main.py` 파일 생성
- ✅ `env.js` 파일 업데이트
- ✅ `start_server.sh` 파일 생성
- ✅ Flask 서버 실행 (http://localhost:8082)
- ✅ Frontend에서 정상 응답 확인

### 테스트 방법
1. 터미널에서 `./start_server.sh` 실행
2. 브라우저에서 `index.html` 열기
3. 테스트 쿼리 입력:
   ```
   서울특별시 서초구 방배중앙로 06681에서 화재가 발생했습니다. 
   가까운 소방서를 찾아주세요.
   ```

### 예상 결과
- ✅ 가까운 소방서 5곳 표시
- ✅ 지도에 마커 표시
- ✅ 기상 정보 (풍속, 풍향, 온도)
- ✅ 관련 뉴스

---

## 🔄 실습 진행 순서

```
실습 1 (환경 구성)
    ↓
실습 2 (Memory 구성) → Memory ID 저장
    ↓
실습 3 (Vector Database) → 임베딩 완료
    ↓
실습 4 (Agent Runtime) → Agent ARN 저장
    ↓
실습 5 (웹 애플리케이션) → 전체 테스트
```

---

## 📁 생성되는 파일

| 실습 | 생성 파일 | 용도 |
|------|-----------|------|
| 2 | `agent/deploy/runtime/config_memory.py` | Memory ID 저장 |
| 4 | `agent/deploy/runtime/config.py` | Agent 설정 |
| 4 | `agent_arn.txt` | Agent ARN 저장 |
| 5 | `agent/main.py` | Flask 서버 |
| 5 | `env.js` | Frontend 설정 |
| 5 | `start_server.sh` | 서버 실행 스크립트 |

---

## ⚠️ 주의사항

### 실습 2 완료 후
- Memory ID를 잃어버리면 다시 생성해야 합니다
- `config_memory.py` 파일을 백업하세요

### 실습 3 진행 중
- 임베딩은 10-15분 소요됩니다
- 중간에 중단하지 마세요

### 실습 4 완료 후
- Agent ARN을 잃어버리면 AWS Console에서 확인 가능
- `agent_arn.txt` 파일을 백업하세요

### 실습 5 진행 중
- Flask 서버는 포트 8082를 사용합니다
- 포트 충돌 시 main.py에서 포트 변경 가능

---

## 🐛 문제 해결

### Memory ID를 잃어버렸을 때
```python
from bedrock_agentcore_starter_toolkit.operations.memory.manager import MemoryManager
memory_manager = MemoryManager(region_name="us-west-2")
memories = memory_manager.list_memories()
for m in memories:
    print(f"ID: {m.get('id')}, Name: {m.get('name')}")
```

### Agent ARN을 잃어버렸을 때
- `agent_arn.txt` 파일 확인
- AWS Console > Bedrock > Agent Core 확인

### Vector 검색이 안 될 때
- 실습 3의 임베딩 완료 확인
- S3 Vectors Index 상태 확인

### Flask 서버 오류
```bash
# 포트 확인
lsof -i :8082

# 포트 변경 (main.py 수정)
app.run(host='0.0.0.0', port=8083)
```

---

## ⏱️ 전체 소요 시간

| 실습 | 시간 |
|------|------|
| 실습 1 | 15분 |
| 실습 2 | 20분 |
| 실습 3 | 30분 |
| 실습 4 | 30분 |
| 실습 5 | 20분 |
| **총** | **2시간** |

---

## 🎯 학습 목표 달성 확인

- [ ] Bedrock Agent Core Memory 생성 및 활용
- [ ] S3 Vectors를 이용한 벡터 검색 구현
- [ ] Strands Agent 구축 및 Tool 통합
- [ ] Runtime 배포 및 서버리스 실행
- [ ] Frontend 통합 및 실시간 스트리밍

---

**모든 실습을 완료하면 화재 대응 어시스턴트가 완성됩니다! 🎉**
