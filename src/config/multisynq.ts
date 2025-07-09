// Multisynq API Configuration
const requiredEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_MULTISYNQ_API_KEY,
} as const;

// 환경 변수 검증
function validateEnvVars() {
  const missing = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// 개발 환경에서만 검증 실행
if (process.env.NODE_ENV === 'development') {
  validateEnvVars();
}

export const MULTISYNQ_CONFIG = {
  // API 키 (필수)
  apiKey: requiredEnvVars.apiKey || "",
  
  // 앱 ID (고유한 식별자)
  appId: "io.multisync.chat",
  
  // 세션 이름
  name: "public",
  
  // 세션 비밀번호 (공개 세션의 경우 "none")
  password: "none",
} as const; 