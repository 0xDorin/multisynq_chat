"use client";

import { LiveChatToggle } from "@/components/LiveChatToggle";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNickname } from "@/context/NicknameContext";
import { useCountStore } from "@/store/testStore";

export default function Home() {
  const [input, setInput] = useState("");
  const [tempNickname, setTempNickname] = useState("");
  const router = useRouter();
  const { nickname, setNickname } = useNickname();
  
  // Zustand test
  const [testInput, setTestInput] = useState("");
  const { count, increment } = useCountStore();

  const handleNicknameSubmit = () => {
    if (tempNickname.trim()) {
      setNickname(tempNickname.trim());
      setTempNickname("");
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">메인 페이지</h1>
      
      {/* Zustand Test */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">Zustand Test</h2>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="값을 입력하세요"
            className="px-4 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={() => increment(Number(testInput))}
            className="px-4 py-2 bg-[#a259ff] text-white rounded hover:bg-[#b084fa]"
          >
            Set
          </button>
          <button
            onClick={() => alert(count[Number(testInput)] || "없음!")}
            className="px-4 py-2 bg-[#a259ff] text-white rounded hover:bg-[#b084fa]"
          >
            Get
          </button>
        </div>
        <p className="text-sm text-gray-600">
          현재 저장된 값: <span className="font-medium">{count[Number(testInput)] || "없음!"}</span>
        </p>
      </div>

      <p className="text-lg text-gray-600 mb-8">
        우측 하단의 채팅 버튼을 클릭하여 실시간 채팅을 시작하세요.
      </p>

      {/* 토큰 입력 */}
      <div className="mb-8">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md mb-4 mr-2"
        />
        <button
          onClick={() => {
            router.push(`/token/${input}`);
          }}
          className="px-4 py-2 bg-[#a259ff] text-white rounded hover:bg-[#b084fa]"
        >
          Go to Token Page
        </button>
      </div>

      {/* 닉네임 설정 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={tempNickname}
            onChange={(e) => setTempNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            className="px-4 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={handleNicknameSubmit}
            disabled={!tempNickname.trim()}
            className="px-4 py-2 bg-[#a259ff] text-white rounded hover:bg-[#b084fa] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            닉네임 설정
          </button>
        </div>
        {nickname && (
          <p className="text-sm text-gray-600">
            현재 닉네임: <span className="font-medium">{nickname}</span>
          </p>
        )}
      </div>

      {/* 채팅 토글 버튼 */}
      <LiveChatToggle
        roomId="lobby"
        position="bottom-right"
        nickname={nickname == "" ? undefined : nickname}
      />
    </main>
  );
}
