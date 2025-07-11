'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { View, type MultisynqSession } from '@multisynq/client';
import { ChatModel } from '@/lib/ChatModel';
import { ChatContainer } from './chat/ChatContainer';

interface ChatViewProps {
  model: any;
  session: MultisynqSession<any>;
}

// Error boundary component
class ChatErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chat error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-red-400 mb-2">Chat Error</p>
            <p className="text-gray-400 text-sm mb-4">
              {this.state.error?.message || 'Something went wrong'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-[#a259ff] text-white rounded hover:bg-[#b084fa]"
            >
              Reload Chat
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Multisynq View 클래스 - 모델과 React 상태를 연결하는 브릿지
export class ChatView extends View {
  private model: ChatModel;
  private onHistoryUpdate?: (history: { viewId: string; html: string }[]) => void;
  private onNewMessage?: (message: { viewId: string; html: string }) => void;
  private onViewInfoUpdate?: (nickname: string, viewCount: number) => void;
  private isDestroyed = false;

  constructor(model: ChatModel) {
    super(model);
    this.model = model;

    try {
      // 이벤트 구독 설정
      this.subscribe("history", "refresh", this.handleHistoryRefresh);  // 전체 히스토리 갱신
      this.subscribe("history", "newMessage", this.handleNewMessage);   // 개별 메시지 추가
      this.subscribe("viewInfo", "refresh", this.handleViewInfoRefresh);

      // 초기 상태 동기화
      this.handleHistoryRefresh();
      this.handleViewInfoRefresh();

      // 첫 입장 시 채팅방이 비어있으면 히스토리 초기화
      if (this.model.getParticipants() === 1 &&
          !this.model.getHistory().find(item => item.viewId === this.viewId)) {
        this.publish("input", "reset", "for new participants");
      }
    } catch (error) {
      console.error('ChatView initialization error:', error);
    }
  }

  // React 상태 업데이트 콜백 등록
  setUpdateCallbacks(
    onHistoryUpdate: (history: { viewId: string; html: string }[]) => void,
    onNewMessage: (message: { viewId: string; html: string }) => void,
    onViewInfoUpdate: (nickname: string, viewCount: number) => void
  ) {
    this.onHistoryUpdate = onHistoryUpdate;
    this.onNewMessage = onNewMessage;
    this.onViewInfoUpdate = onViewInfoUpdate;
  }

  // 전체 히스토리 갱신 처리 (초기 로드, 메시지 삭제 시)
  private handleHistoryRefresh = () => {
    if (this.isDestroyed) return;
    
    try {
      const history = this.model.getHistory();
      this.onHistoryUpdate?.(history);
    } catch (error) {
      console.error('History refresh error:', error);
    }
  };

  // 새 메시지 추가 처리 (일반적인 채팅 시)
  private handleNewMessage = (message: { viewId: string; html: string }) => {
    if (this.isDestroyed) return;
    
    try {
      this.onNewMessage?.(message);
    } catch (error) {
      console.error('New message error:', error);
    }
  };

  // 참여자 정보 갱신 처리
  private handleViewInfoRefresh = () => {
    if (this.isDestroyed) return;
    
    try {
      const views = this.model.getViews();
      const nickname = views.get(this.viewId) || '';
      const viewCount = this.model.getParticipants();
      this.onViewInfoUpdate?.(nickname, viewCount);
    } catch (error) {
      console.error('View info refresh error:', error);
    }
  };

  // 채팅 메시지 전송
  sendMessage(text: string) {
    if (this.isDestroyed) return;
    
    try {
      this.publish("input", "newPost", { viewId: this.viewId, text });
    } catch (error) {
      console.error('Send message error:', error);
    }
  }

  // 리소스 정리
  cleanup() {
    this.isDestroyed = true;
    try {
      this.detach();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

export function ChatViewComponent({ model, session }: ChatViewProps) {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: Error) => {
    console.error('Chat component error:', error);
    setError(error.message);
  }, []);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-2">Chat Error</p>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="px-4 py-2 bg-[#a259ff] text-white rounded hover:bg-[#b084fa]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ChatErrorBoundary>
      <ChatContainer model={model} session={session} />
    </ChatErrorBoundary>
  );
} 