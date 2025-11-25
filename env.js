// ============================================
// 환경 변수 및 API 키 관리
// ============================================
// 🔧 워크샵 참가자: 아래 값들을 본인의 설정으로 변경하세요
// 📖 자세한 설정 방법은 README.md의 "사전 준비" 섹션을 참고하세요

const ENV = {
    // User Session
    USER_ID: '',  // 🔧 변경: 본인의 사용자 ID
    SESSION_ID: '',  // 🔧 변경: 본인의 세션 ID
    
    // Windy API (기상 정보)
    WINDY_API_KEY: '',  // 🔧 변경: https://api.windy.com 에서 발급
    WINDY_API_URL: 'https://api.windy.com/api/point-forecast/v2',
    
    // Agent API (백엔드 서버)
    AGENT_API_URL: 'http://localhost:8082/analyze',  // 🔧 변경: 본인의 Agent 엔드포인트
};
