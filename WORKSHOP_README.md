# 🔥 Bedrock Agent Core 화재 대응 어시스턴트 워크샵

## 빠른 시작

### 1. 사전 준비 (10분)

```bash
# 1. Windy API Key 발급
# https://api.windy.com 에서 무료 계정 생성 후 API Key 발급

# 2. env.js 파일 수정
# WINDY_API_KEY에 발급받은 키 입력
```

### 2. Jupyter Notebook 실행

```bash
# Notebook 열기
jupyter notebook workshop_bedrock_agent_core.ipynb
```

### 3. 순서대로 실행

1. **Step 1**: 패키지 설치 (5분)
2. **Step 2**: Memory 생성 → **Memory ID 복사** (5분)
3. **Step 3**: S3 Vector Database 생성 (5분)
4. **Step 4**: 소방서 데이터 임베딩 (15분)
5. **Step 5**: Agent Runtime 배포 → **Agent ARN 복사** (10분)
6. **Step 6**: Flask 서버 실행 (2분)
7. **Step 7**: Frontend 테스트 (5분)

### 4. 설정 파일 업데이트

#### agent/deploy/runtime/config.py
```python
MEMORY_ID = "customMemory-xxxxx"  # Step 2에서 복사한 ID
WINDY_API_KEY = "your-api-key"    # Windy API Key
```

#### agent/main.py
```python
agentRuntimeArn='arn:aws:bedrock-agentcore:...'  # Step 5에서 복사한 ARN
```

### 5. 테스트

```bash
# 터미널에서 Flask 서버 실행
cd agent
python main.py

# 브라우저에서 index.html 열기
# 테스트 쿼리: "서울특별시 서초구 방배중앙로 06681에서 화재가 발생했습니다. 가까운 소방서를 찾아주세요."
```

---

## 📁 파일 구조

```
disaster_starter_kit/
├── workshop_bedrock_agent_core.ipynb  ⭐ 메인 워크샵 파일
├── WORKSHOP_GUIDE.md                  📖 상세 가이드
├── WORKSHOP_README.md                 📋 빠른 시작 가이드
├── agent/
│   ├── deploy/
│   │   ├── memory/deploy.py
│   │   └── runtime/
│   │       ├── config.py              🔧 설정 파일 (수정 필요)
│   │       └── deploy.py
│   └── main.py                        🔧 Flask 서버 (ARN 수정 필요)
├── misc/
│   └── 소방청_전국소방서 좌표현황.csv
├── index.html                         🌐 Frontend
└── env.js                             🔧 API Key (수정 필요)
```

---

## ⚠️ 중요 체크포인트

### ✅ Step 2 완료 후
- [ ] Memory ID를 복사했나요?
- [ ] `config.py`에 Memory ID를 저장했나요?

### ✅ Step 5 완료 후
- [ ] Agent ARN을 복사했나요?
- [ ] `main.py`에 Agent ARN을 저장했나요?

### ✅ Step 7 실행 전
- [ ] `env.js`에 Windy API Key가 있나요?
- [ ] Flask 서버가 실행 중인가요? (http://localhost:8082)

---

## 🐛 문제 해결

### "Memory ID를 잃어버렸어요"
```python
from bedrock_agentcore_starter_toolkit.operations.memory.manager import MemoryManager
memory_manager = MemoryManager(region_name="us-west-2")
memories = memory_manager.list_memories()
for m in memories:
    print(f"ID: {m.get('id')}, Name: {m.get('name')}")
```

### "Vector 검색이 안 돼요"
- Step 4를 다시 실행하세요
- 임베딩 완료까지 10-15분 소요

### "Agent 호출이 안 돼요"
- `main.py`의 Agent ARN 확인
- Runtime 배포 상태 확인

### "Flask 서버 오류"
- 포트 8082가 사용 중인지 확인: `lsof -i :8082`
- 다른 포트 사용: `app.run(port=8083)`

---

## 📚 상세 가이드

더 자세한 내용은 `WORKSHOP_GUIDE.md`를 참고하세요:
- Memory 개념 설명
- S3 Vectors 상세 설명
- 아키텍처 다이어그램
- 확장 아이디어
- FAQ

---

## 🎯 예상 결과

워크샵 완료 후:
- ✅ 주소 입력 시 가까운 소방서 5곳 표시
- ✅ 지도에 소방서 위치 마커 표시
- ✅ 실시간 기상 정보 (풍속, 풍향, 온도)
- ✅ 관련 뉴스 및 지역 정보
- ✅ 대화 컨텍스트 유지 (Memory)

---

## ⏱️ 예상 소요 시간

| Step | 작업 | 시간 |
|------|------|------|
| 1 | 환경 설정 | 15분 |
| 2 | Memory 생성 | 20분 |
| 3 | Vector DB 생성 | 15분 |
| 4 | 데이터 임베딩 | 30분 |
| 5 | Runtime 배포 | 30분 |
| 6 | Flask 서버 | 10분 |
| 7 | Frontend 테스트 | 20분 |
| **총** | | **2-3시간** |

---

## 💰 예상 비용

워크샵 진행 시:
- Bedrock 모델 호출: ~$2-3
- S3 Vectors: ~$1-2
- ECR: ~$1
- **총 예상 비용: $5-10**

---

## 🎓 학습 목표

이 워크샵을 통해 배우는 것:
1. ✅ Bedrock Agent Core Memory 활용
2. ✅ S3 Vectors를 이용한 벡터 검색
3. ✅ Strands Agent 구축 및 Tool 통합
4. ✅ Runtime 배포 및 서버리스 실행
5. ✅ Frontend 통합 및 실시간 스트리밍

---

**워크샵을 시작하세요! 🚀**

문제가 있으면 `WORKSHOP_GUIDE.md`의 "문제 해결" 섹션을 확인하세요.
