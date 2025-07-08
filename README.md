# Multisync Chat

Next.js와 Multisynq를 사용한 실시간 멀티 유저 채팅 애플리케이션입니다.

## 🚀 시작하기

### 1. API 키 설정

1. `src/config/multisynq.ts` 파일을 열어주세요
2. `apiKey` 값을 발급받은 API 키로 변경하세요:

```typescript
export const MULTISYNQ_CONFIG = {
  apiKey: "your_actual_api_key_here", // 여기에 실제 API 키를 입력
  appId: "io.multisync.chat",
  name: "public",
  password: "none",
};
```

### 2. 개발 서버 실행

```bash
yarn dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

## 🎯 기능

- 실시간 멀티 유저 채팅
- 자동 닉네임 할당
- 20분 비활성 후 자동 리셋
- `/reset` 명령어로 수동 리셋
- 반응형 디자인

## 🔧 기술 스택

- **Next.js 15.3.2**
- **TypeScript**
- **Tailwind CSS**
- **@multisynq/client** (실시간 동기화)
- **yarn** (패키지 매니저)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
