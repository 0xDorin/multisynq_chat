"use client";

import { LiveChatToggle } from "@/components/LiveChatToggle";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useNickname } from "@/context/NicknameContext";

export default function TokenPage() {
  const { address } = useParams<{ address: string }>();
  const { nickname, setNickname } = useNickname();

  return (
    <main className="min-h-screen p-8">
      <Link
        href="/"
        className="text-4xl font-bold mb-4 hover:text-[#a259ff] transition-colors inline-block"
      >
        메인 페이지
      </Link>
      <p className="text-lg text-gray-600 mb-8">
        우측 하단의 채팅 버튼을 클릭하여 실시간 채팅을 시작하세요.
      </p>

      {/* 채팅 토글 버튼 - 데스크탑에서만 표시 */}
      <div className="hidden md:block">
        <LiveChatToggle
          key={address}
          roomId={address}
          position="bottom-right"
          nickname={nickname}
        />
      </div>
    </main>
  );
}
