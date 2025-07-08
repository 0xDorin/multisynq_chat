'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, type MultisynqSession } from '@multisynq/client';
import { ChatModel } from '@/lib/ChatModel';

interface ChatViewProps {
  model: ChatModel;
  session?: MultisynqSession<any> | null;
}

// Multisynq View 클래스 - 모델과 React 상태를 연결하는 브릿지
export class ChatView extends View {
  private model: ChatModel;
  private onHistoryUpdate?: (history: { viewId: string; html: string }[]) => void;
  private onViewInfoUpdate?: (nickname: string, viewCount: number) => void;

  constructor(model: ChatModel) {
    super(model);
    this.model = model;

    // 모델 이벤트 구독 (View에서만 가능)
    this.subscribe("history", "refresh", this.handleHistoryRefresh);
    this.subscribe("viewInfo", "refresh", this.handleViewInfoRefresh);

    // 초기 상태 동기화
    this.handleHistoryRefresh();
    this.handleViewInfoRefresh();

    // 혼자 있고 기존 채팅에 내가 참여하지 않았다면 리셋
    if (this.model.getParticipants() === 1 &&
        !this.model.getHistory().find(item => item.viewId === this.viewId)) {
      this.publish("input", "reset", "for new participants");
    }
  }

  // React 상태 업데이트 콜백 등록
  setUpdateCallbacks(
    onHistoryUpdate: (history: { viewId: string; html: string }[]) => void,
    onViewInfoUpdate: (nickname: string, viewCount: number) => void
  ) {
    this.onHistoryUpdate = onHistoryUpdate;
    this.onViewInfoUpdate = onViewInfoUpdate;
  }

  private handleHistoryRefresh = () => {
    const history = this.model.getHistory();
    this.onHistoryUpdate?.(history);
  };

  private handleViewInfoRefresh = () => {
    const views = this.model.getViews();
    const nickname = views.get(this.viewId) || '';
    const viewCount = this.model.getParticipants();
    this.onViewInfoUpdate?.(nickname, viewCount);
  };

  // 채팅 전송
  sendMessage(text: string) {
    if (text.trim() === '/reset') {
      this.publish("input", "reset", "at user request");
    } else {
      this.publish("input", "newPost", { viewId: this.viewId, text });
    }
  }

  // 정리
  cleanup() {
    this.detach();
  }
}

// React 컴포넌트 - UI 렌더링 및 사용자 상호작용
export function ChatViewComponent({ model, session }: ChatViewProps) {
  // React 상태
  const [history, setHistory] = useState<{ viewId: string; html: string }[]>([]);
  const [nickname, setNickname] = useState<string>('');
  const [viewCount, setViewCount] = useState<number>(1);
  const [input, setInput] = useState('');
  const [chatView, setChatView] = useState<ChatView | null>(null);
  const textOutRef = useRef<HTMLDivElement>(null);

  // ChatView 인스턴스 생성 및 콜백 연결
  useEffect(() => {
    if (!model) return;

    const view = new ChatView(model);
    
    // React 상태 업데이트 콜백 등록
    view.setUpdateCallbacks(
      (newHistory) => setHistory([...newHistory]),
      (newNickname, newViewCount) => {
        setNickname(newNickname);
        setViewCount(newViewCount);
      }
    );

    setChatView(view);

    return () => {
      view.cleanup();
    };
  }, [model]);

  // 채팅 입력 핸들러
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim() || !chatView) return;
    chatView.sendMessage(input);
    setInput('');
  }, [input, chatView]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  }, [handleSend]);

  // 채팅 스크롤 자동 아래로
  useEffect(() => {
    if (textOutRef.current) {
      textOutRef.current.scrollTop = textOutRef.current.scrollHeight;
    }
  }, [history]);

  // 닉네임 fallback 처리
  const realNickname = nickname || (
    session?.view?.viewId ? model.getViews().get(session.view.viewId) : ''
  ) || 'Loading...';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Multisynq Chat
        </h1>
        
        {/* 사용자 정보 */}
        <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">
            <b>Nickname:</b> {realNickname}
          </div>
          <div className="text-sm text-gray-600">
            <b>Total Views:</b> {viewCount}
          </div>
        </div>
        
        {/* 채팅 히스토리 */}
        <div
          ref={textOutRef}
          className="h-96 overflow-y-auto p-4 bg-gray-50 rounded border mb-4 text-sm text-gray-800"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          <b>Welcome to Multisynq Chat!</b>
          <br /><br />
          {history.map((item, idx) => (
            <div key={idx} dangerouslySetInnerHTML={{ __html: item.html }} />
          ))}
        </div>
        
        {/* 입력 영역 */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type your message here..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
          <button
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={handleSend}
          >
            Send
          </button>
        </div>
        
        {/* 사용법 안내 */}
        <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Type <code>/reset</code> to clear the chat history</li>
            <li>Press Enter or click Send to post a message</li>
            <li>Chat will automatically reset after 20 minutes of inactivity</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 