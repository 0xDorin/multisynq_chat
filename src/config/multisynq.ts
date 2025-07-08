// Multisynq API Configuration
export const MULTISYNQ_CONFIG = {
  // 여기에 발급받은 API 키를 입력하세요
  apiKey: process.env.NEXT_PUBLIC_MULTISYNQ_API_KEY || "",
  
  // 앱 ID (고유한 식별자)
  appId: "io.multisync.chat",
  
  // 세션 이름
  name: "public",
  
  // 세션 비밀번호 (공개 세션의 경우 "none")
  password: "none",
}; 