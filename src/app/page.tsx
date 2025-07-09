'use client';

import { LiveChatToggle } from '@/components/LiveChatToggle';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [input, setInput] = useState('');
  const router = useRouter();
  
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">메인 페이지</h1>
      <p className="text-lg text-gray-600 mb-8">
        우측 하단의 채팅 버튼을 클릭하여 실시간 채팅을 시작하세요.
      </p>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-md mb-4"
      />

      <button onClick={() => {
        router.push(`/token/${input}`);
      }}
      className="px-4 py-2 bg-[#a259ff] text-white rounded hover:bg-[#b084fa]"
      >
        Go to Token Page
      </button>
      
      {/* 채팅 토글 버튼 */}
      <LiveChatToggle 
        roomId="lobby" 
        position="bottom-right"
      />
    </main>
  );
}
