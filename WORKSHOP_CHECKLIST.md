# ✅ 워크샵 체크리스트

## 📋 워크샵 시작 전

### 환경 준비
- [ ] AWS 계정 준비 완료
- [ ] AWS CLI 설치 및 설정 완료
- [ ] Python 3.9 이상 설치
- [ ] Docker 설치 (Runtime 배포용)
- [ ] Jupyter Notebook 환경 준비

### 권한 확인
- [ ] Amazon Bedrock 모델 액세스 권한
- [ ] S3 및 S3 Vectors 사용 권한
- [ ] ECR (Elastic Container Registry) 권한
- [ ] IAM Role 생성 권한
- [ ] CloudWatch Logs 권한

### API Key 발급
- [ ] Windy API Key 발급 완료 (https://api.windy.com)
- [ ] API Key를 `env.js` 파일에 저장

### 파일 확인
- [ ] `workshop_bedrock_agent_core.ipynb` 파일 존재
- [ ] `misc/소방청_전국소방서 좌표현황(XY좌표)_20240901.csv` 파일 존재
- [ ] `agent/` 디렉토리 구조 확인
- [ ] `index.html` 파일 존재

---

## 🔧 Step 1: 환경 설정

- [ ] Jupyter Notebook 실행
- [ ] 필요한 패키지 설치 완료
  - [ ] strands-agents
  - [ ] bedrock-agentcore
  - [ ] bedrock-agentcore-starter-toolkit
  - [ ] boto3
  - [ ] wikipedia
  - [ ] pandas
  - [ ] flask, flask-cors
  - [ ] playwright
- [ ] Playwright 브라우저 설치 완료
- [ ] AWS 계정 ID 확인 완료
- [ ] Region 설정 확인 (us-west-2)

---

## 🧠 Step 2: Memory 생성

### Memory 생성
- [ ] MemoryManager 임포트 성공
- [ ] Memory 생성 성공
- [ ] Memory ID 출력 확인

### Memory ID 저장
- [ ] Memory ID 복사 완료
- [ ] `agent/deploy/runtime/config.py` 파일 열기
- [ ] `MEMORY_ID` 변수에 복사한 ID 저장
- [ ] 파일 저장 완료

### Memory 개념 이해
- [ ] Short-term Memory 개념 이해
- [ ] Long-term Memory 개념 이해
- [ ] Semantic Strategy 개념 이해

---

## 🗄️ Step 3: S3 Vector Database 생성

### S3 Bucket 생성
- [ ] S3 Bucket 생성 성공 (`firestation-location-xy`)
- [ ] 또는 기존 Bucket 확인

### Vector Index 생성
- [ ] Vector Index 생성 성공 (`fire-station`)
- [ ] Index ARN 확인
- [ ] Vector Dimensions: 1024 확인
- [ ] Vector Data Type: float32 확인

### 개념 이해
- [ ] S3 Vectors 개념 이해
- [ ] Vector 검색 원리 이해

---

## 📊 Step 4: 소방서 데이터 임베딩

### CSV 파일 읽기
- [ ] CSV 파일 로드 성공
- [ ] 데이터 샘플 확인
- [ ] 총 데이터 개수 확인

### 임베딩 생성 및 저장
- [ ] Bedrock Runtime 클라이언트 생성
- [ ] 임베딩 생성 시작
- [ ] 진행 상황 모니터링
- [ ] 배치 저장 확인 (50개씩)
- [ ] 전체 데이터 임베딩 완료

### Vector Search 테스트
- [ ] 테스트 주소로 검색 실행
- [ ] 가까운 소방서 5곳 출력 확인
- [ ] 각 소방서 정보 확인
  - [ ] 이름
  - [ ] 위도/경도
  - [ ] 주소
  - [ ] 전화번호
  - [ ] 유사도 점수

### 개념 이해
- [ ] 임베딩 개념 이해
- [ ] Titan Embed Text v2 모델 이해
- [ ] 유사도 검색 원리 이해

---

## 🚀 Step 5: Agent Runtime 배포

### 디렉토리 이동
- [ ] `agent/deploy/runtime` 디렉토리로 이동
- [ ] 현재 디렉토리 확인

### config.py 파일 확인
- [ ] `config.py` 파일 열기
- [ ] `MEMORY_ID` 확인 (Step 2에서 저장한 ID와 일치)
- [ ] `WINDY_API_KEY` 확인
- [ ] 필요시 수정 완료

### Runtime 배포
- [ ] Runtime 인스턴스 생성
- [ ] Runtime 설정 완료
  - [ ] entrypoint: bedrock_agent_core.py
  - [ ] auto_create_execution_role: True
  - [ ] auto_create_ecr: True
  - [ ] requirements_file: requirements.txt
- [ ] Docker 이미지 빌드 시작
- [ ] ECR에 이미지 푸시 완료
- [ ] Runtime 생성 완료

### Agent ARN 저장
- [ ] Agent ARN 출력 확인
- [ ] Agent ARN 복사 완료
- [ ] ECR URI 확인

### 개념 이해
- [ ] Bedrock Agent Core Runtime 개념 이해
- [ ] Docker 컨테이너화 이해
- [ ] 서버리스 실행 이해

---

## 🌐 Step 6: Flask 서버 설정

### main.py 파일 확인
- [ ] 프로젝트 루트로 이동
- [ ] `agent/main.py` 파일 열기
- [ ] 현재 설정된 Agent ARN 확인
- [ ] Step 5에서 복사한 ARN과 비교

### Agent ARN 업데이트
- [ ] `agentRuntimeArn` 값 업데이트
- [ ] 파일 저장 완료
- [ ] 또는 Notebook에서 자동 업데이트 실행

### Flask 서버 실행
- [ ] 터미널 열기
- [ ] `agent` 디렉토리로 이동
- [ ] `python main.py` 실행
- [ ] 서버 시작 확인 (http://localhost:8082)
- [ ] 오류 없이 실행 중

---

## 🎨 Step 7: Frontend 테스트

### env.js 파일 확인
- [ ] `env.js` 파일 열기
- [ ] `WINDY_API_KEY` 확인
- [ ] `AGENT_API_URL` 확인 (http://localhost:8082/analyze)
- [ ] `USER_ID` 및 `SESSION_ID` 확인

### index.html 실행
- [ ] 브라우저에서 `index.html` 열기
- [ ] 또는 Live Server 실행
- [ ] 페이지 로드 확인
- [ ] 지도 표시 확인

### 기능 테스트

#### 테스트 1: 소방서 검색
- [ ] 테스트 쿼리 입력: "서울특별시 서초구 방배중앙로 06681에서 화재가 발생했습니다. 가까운 소방서를 찾아주세요."
- [ ] 응답 수신 확인
- [ ] 가까운 소방서 5곳 표시 확인
- [ ] 지도에 마커 표시 확인
- [ ] 각 소방서 정보 확인
  - [ ] 이름
  - [ ] 위도/경도
  - [ ] 주소
  - [ ] 전화번호

#### 테스트 2: 기상 정보
- [ ] 기상 정보 표시 확인
- [ ] 온도 표시
- [ ] 풍속 표시
- [ ] 풍향 표시
- [ ] 습도 표시
- [ ] 기압 표시

#### 테스트 3: 뉴스 검색 (Browser Tool)
- [ ] 관련 뉴스 표시 확인
- [ ] 뉴스 제목 및 날짜
- [ ] 뉴스 요약
- [ ] 출처 표시

#### 테스트 4: Memory 기능
- [ ] 이전 대화 참조 테스트
- [ ] "아까 검색한 소방서는?" 질문
- [ ] Short-term Memory 작동 확인
- [ ] 대화 컨텍스트 유지 확인

---

## 🎉 워크샵 완료 확인

### 전체 시스템 작동
- [ ] Frontend에서 질문 입력 가능
- [ ] Flask 서버가 요청 수신
- [ ] Agent Runtime 호출 성공
- [ ] 스트리밍 응답 수신
- [ ] 지도 업데이트 확인

### 주요 기능 확인
- [ ] ✅ 소방서 검색 (Vector Search)
- [ ] ✅ 기상 정보 조회 (Windy API)
- [ ] ✅ 뉴스 검색 (Browser Tool)
- [ ] ✅ 위키피디아 검색
- [ ] ✅ Memory 기능 (Short-term & Long-term)
- [ ] ✅ 지도 시각화

### 학습 목표 달성
- [ ] Bedrock Agent Core Memory 이해 및 활용
- [ ] S3 Vectors를 이용한 벡터 검색 구현
- [ ] Strands Agent 구축 및 Tool 통합
- [ ] Runtime 배포 및 서버리스 실행
- [ ] Frontend 통합 및 실시간 스트리밍

---

## 📝 추가 확인 사항

### 리소스 정리 (워크샵 종료 후)
- [ ] Memory 삭제 여부 결정
- [ ] S3 Bucket 삭제 여부 결정
- [ ] ECR 이미지 삭제 여부 결정
- [ ] Agent Runtime 삭제 여부 결정

### 비용 확인
- [ ] Bedrock 사용량 확인
- [ ] S3 Vectors 사용량 확인
- [ ] ECR 스토리지 확인
- [ ] 예상 비용 검토

### 문서화
- [ ] 워크샵 경험 기록
- [ ] 발생한 문제 및 해결 방법 기록
- [ ] 개선 아이디어 기록

---

## 🐛 문제 발생 시

### 체크 포인트
- [ ] CloudWatch Logs 확인
- [ ] Flask 서버 로그 확인
- [ ] 브라우저 콘솔 확인
- [ ] Network 탭 확인

### 참고 문서
- [ ] `WORKSHOP_GUIDE.md` "문제 해결" 섹션 확인
- [ ] AWS 공식 문서 참조
- [ ] GitHub Issues 검색

---

## 🎓 다음 단계

### 확장 아이디어
- [ ] 다중 언어 지원 고려
- [ ] 실시간 화재 감지 연동 고려
- [ ] 대응 시뮬레이션 기능 추가 고려
- [ ] 모바일 앱 개발 고려
- [ ] 음성 인터페이스 추가 고려

### 추가 학습
- [ ] Bedrock Agent Core 고급 기능 학습
- [ ] Strands Agent 심화 학습
- [ ] Vector Database 최적화 학습
- [ ] 서버리스 아키텍처 학습

---

**워크샵을 완료하신 것을 축하합니다! 🎉**

모든 체크리스트를 완료하셨다면, 성공적으로 화재 대응 어시스턴트를 구축하신 것입니다!
