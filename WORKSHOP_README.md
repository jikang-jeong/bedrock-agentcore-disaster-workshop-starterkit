# 🔥 Bedrock Agent Core 화재 대응 어시스턴트 워크샵

## 📚 실습 구성 (총 7개)

### 실습 1: 환경 구성 (15분)
**파일**: `lab1_environment_setup.ipynb`
- Python 패키지 설치
- AWS 환경 확인
- `.env` 파일 생성 및 Windy API Key 설정

### 실습 2: Memory 구성 (20분)
**파일**: `lab2_memory_setup.ipynb`
- Bedrock Agent Core Memory 생성
- Short-term & Long-term Memory 이해
- Memory ID를 `.env`에 저장

### 실습 3: Vector Database 구성 (30분)
**파일**: `lab3_vector_database.ipynb`
- S3 Vector Bucket 생성
- Vector Index 생성
- 소방서 데이터 임베딩
- Vector Search 테스트

### 실습 4: Agent 생성 (20분)
**파일**: `lab4_create_agent.ipynb`
- Memory Manager 구현
- Memory Hooks 구현
- Agent Factory 생성

### 실습 5: Tools 생성 (20분)
**파일**: `lab5_create_tools.ipynb`
- config.py 생성
- Disaster Tools 구현 (소방서 검색, 기상 정보, 위키피디아)
- Browser Tool 구현
- Factory에 Tools 통합

### 실습 6: Runtime 배포 (30분)
**파일**: `lab6_agent_runtime.ipynb`
- bedrock_agent_core.py 생성
- requirements.txt 생성
- Runtime 배포 (Docker 빌드)
- Agent ARN을 `.env`에 저장
- S3 Vectors 권한 추가

### 실습 7: 웹 애플리케이션 연동 (20분)
**파일**: `lab7_web_application.ipynb`
- Flask API 서버 생성 (`agent/main.py`)
- `env.js` 생성
- HTTP 서버 스크립트 생성
- 전체 시스템 테스트

---

## 🚀 빠른 시작

### 1. 사전 준비
```bash
# Windy API Key 발급
# https://api.windy.com
```

### 2. 실습 순서대로 실행
```bash
jupyter notebook lab1_environment_setup.ipynb
# 완료 후 순서대로
jupyter notebook lab2_memory_setup.ipynb
jupyter notebook lab3_vector_database.ipynb
jupyter notebook lab4_create_agent.ipynb
jupyter notebook lab5_create_tools.ipynb
jupyter notebook lab6_agent_runtime.ipynb
jupyter notebook lab7_web_application.ipynb
```

### 3. 서버 실행 및 테스트

**터미널 1 (Backend):**
```bash
cd agent
python main.py
```

**터미널 2 (Frontend):**
```bash
python3 -m http.server 8000
```

**브라우저 접근:**
- 로컬: `http://localhost:8000`
- SageMaker: `https://{studio-domain}/jupyter/default/proxy/8000/`

---

## 📁 생성되는 파일 구조

```
disaster_starter_kit/
├── .env                                   🔧 lab1에서 생성
│   ├── AWS_REGION
│   ├── WINDY_API_KEY                      🔧 lab1
│   ├── MEMORY_ID                          🔧 lab2
│   └── AGENT_RUNTIME_ARN                  🔧 lab6
├── agent/
│   ├── main.py                            🔧 lab7에서 생성
│   └── deploy/runtime/
│       ├── bedrock_agent_core.py          🔧 lab6에서 생성
│       ├── requirements.txt               🔧 lab6에서 생성
│       ├── config.py                      🔧 lab5에서 생성
│       ├── agent/
│       │   ├── __init__.py                🔧 lab4에서 생성
│       │   └── factory.py                 🔧 lab4에서 생성
│       ├── memory/
│       │   ├── __init__.py                🔧 lab4에서 생성
│       │   ├── manager.py                 🔧 lab4에서 생성
│       │   └── hooks.py                   🔧 lab4에서 생성
│       └── tool_use/
│           ├── __init__.py                🔧 lab5에서 생성
│           ├── disaster_tools.py          🔧 lab5에서 생성
│           └── browser_tool/
│               ├── __init__.py            🔧 lab5에서 생성
│               └── playwright.py          🔧 lab5에서 생성
├── env.js                                 🔧 lab7에서 생성
├── start_server.sh                        🔧 lab7에서 생성
└── start_http_server.sh                   🔧 lab7에서 생성
```

---

## ⚠️ 중요 체크포인트

### 실습 1 완료 후
- [ ] `.env` 파일 생성 확인
- [ ] Windy API Key 입력 확인

### 실습 2 완료 후
- [ ] Memory ID 출력 확인
- [ ] `.env`에 MEMORY_ID 추가 확인

### 실습 3 완료 후
- [ ] Vector Bucket 생성 확인
- [ ] 소방서 데이터 임베딩 완료
- [ ] Vector Search 테스트 성공

### 실습 4 완료 후
- [ ] `agent/deploy/runtime/agent/factory.py` 생성
- [ ] `agent/deploy/runtime/memory/` 파일들 생성

### 실습 5 완료 후
- [ ] `agent/deploy/runtime/tool_use/disaster_tools.py` 생성
- [ ] `agent/deploy/runtime/config.py` 생성

### 실습 6 완료 후
- [ ] Runtime 배포 완료
- [ ] Agent ARN 출력 확인
- [ ] `.env`에 AGENT_RUNTIME_ARN 추가 확인
- [ ] S3 Vectors 권한 추가 완료

### 실습 7 완료 후
- [ ] `agent/main.py` 생성 확인
- [ ] `env.js` 생성 확인
- [ ] Flask 서버 실행 확인
- [ ] Frontend 정상 작동 확인

---

## 🔧 SageMaker Studio 사용 시

### 서버 주소 변환
```
Frontend: https://{studio-domain}/jupyter/default/proxy/8000/
Backend:  https://{studio-domain}/jupyter/default/proxy/8082/
```

### env.js 수정 필요
lab7 실행 시 Studio 도메인 입력하면 자동으로 설정됩니다.

---

## 🐛 문제 해결

### ".env 파일이 없어요"
- lab1을 먼저 실행하세요

### "Memory ID가 없어요"
- lab2를 먼저 실행하세요
- `.env` 파일에서 MEMORY_ID 확인

### "Vector 검색이 안 돼요"
- lab3의 임베딩 완료 확인 (10-15분 소요)

### "Agent ARN이 없어요"
- lab6을 먼저 실행하세요
- `.env` 파일에서 AGENT_RUNTIME_ARN 확인

### "S3 Vectors 권한 오류"
- lab6의 6-6 셀 실행 확인
- 또는 `python lab4_s3vectors_permission.py` 실행

### "Flask 서버 오류"
- 포트 8082 사용 중인지 확인: `lsof -i :8082`
- `agent/main.py`의 Agent ARN 확인

---

## ⏱️ 예상 소요 시간

| 실습 | 시간 |
|------|------|
| 실습 1 | 15분 |
| 실습 2 | 20분 |
| 실습 3 | 30분 |
| 실습 4 | 20분 |
| 실습 5 | 20분 |
| 실습 6 | 30분 |
| 실습 7 | 20분 |
| **총** | **2.5시간** |

---

## 💰 예상 비용

- Bedrock 모델 호출: ~$2-3
- S3 Vectors: ~$1-2
- ECR: ~$1
- **총: $5-10**

---

## 🎯 학습 목표

- ✅ Bedrock Agent Core Memory 활용
- ✅ S3 Vectors 벡터 검색
- ✅ Strands Agent 구축
- ✅ Tools 통합 (소방서, 기상, 뉴스)
- ✅ Runtime 배포
- ✅ Frontend 통합

---

## 📚 상세 가이드

- `LAB_GUIDE.md` - 실습별 상세 가이드
- `WORKSHOP_GUIDE.md` - 종합 가이드
- `WORKSHOP_CHECKLIST.md` - 체크리스트

---

**워크샵을 시작하세요! 🚀**
