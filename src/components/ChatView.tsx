'use client';

import { View, type MultisynqSession } from '@multisynq/client';
import { ChatModel } from '@/lib/ChatModel';
import { ChatContainer } from './chat/ChatContainer';
import { ChatViewProps } from '@/types/chat';

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

// React 컴포넌트 - 새로운 컨테이너 사용
export function ChatViewComponent({ model, session }: ChatViewProps) {
  return <ChatContainer model={model} session={session} />;
} 