"use client";

import React, { useState, useEffect, useCallback } from "react";
import { View, type MultisynqSession } from "@multisynq/client";
import { ChatModel } from "@/lib/ChatModel";
import { ChatContainer } from "./chat/ChatContainer";

interface ChatViewProps {
  model: View;
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
    console.error("Chat error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-red-400 mb-2">Chat Error</p>
            <p className="text-gray-400 text-sm mb-4">
              {this.state.error?.message || "Something went wrong"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
              }}
              className="px-4 py-2 bg-[#a259ff] text-white rounded hover:bg-[#b084fa]"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export class ChatView extends View {
  private model: ChatModel;
  private onHistoryUpdate?: (
    history: { viewId: string; html: string }[]
  ) => void;
  private onNewMessage?: (message: { viewId: string; html: string }) => void;
  private onViewInfoUpdate?: (nickname: string, viewCount: number) => void;
  private isDestroyed = false;

  constructor(model: ChatModel) {
    super(model);
    this.model = model;

    try {
      // 이벤트 구독 설정
      this.subscribe("history", "refresh", this.handleHistoryRefresh);
      this.subscribe("history", "newMessage", this.handleNewMessage);
      this.subscribe("viewInfo", "refresh", this.handleViewInfoRefresh);

      // 초기 상태 동기화
      this.handleHistoryRefresh();
      this.handleViewInfoRefresh();

      // 첫 입장 시 채팅방이 비어있으면 히스토리 초기화
      if (
        this.model.getParticipants() === 1 &&
        !this.model.getHistory().find((item) => item.viewId === this.viewId)
      ) {
        this.publish("input", "reset", "for new participants");
      }
    } catch (error) {
      console.error("ChatView initialization error:", error);
    }
  }

  setUpdateCallbacks(
    onHistoryUpdate: (history: { viewId: string; html: string }[]) => void,
    onNewMessage: (message: { viewId: string; html: string }) => void,
    onViewInfoUpdate: (nickname: string, viewCount: number) => void
  ) {
    this.onHistoryUpdate = onHistoryUpdate;
    this.onNewMessage = onNewMessage;
    this.onViewInfoUpdate = onViewInfoUpdate;
  }

  private handleHistoryRefresh = () => {
    if (this.isDestroyed) return;

    try {
      const history = this.model.getHistory();
      this.onHistoryUpdate?.(history);
    } catch (error) {
      console.error("History refresh error:", error);
    }
  };

  private handleNewMessage = (message: { viewId: string; html: string }) => {
    if (this.isDestroyed) return;

    try {
      this.onNewMessage?.(message);
    } catch (error) {
      console.error("New message error:", error);
    }
  };

  private handleViewInfoRefresh = () => {
    if (this.isDestroyed) return;

    try {
      const views = this.model.getViews();
      const nickname = views.get(this.viewId) || "";
      const viewCount = this.model.getParticipants();
      this.onViewInfoUpdate?.(nickname, viewCount);
    } catch (error) {
      console.error("View info refresh error:", error);
    }
  };

  sendMessage(text: string) {
    if (this.isDestroyed) return;

    try {
      this.publish("input", "newPost", { viewId: this.viewId, text });
    } catch (error) {
      console.error("Send message error:", error);
    }
  }

  updateNickname(viewId: string, nickname: string) {
    if (this.isDestroyed) return;
    this.publish("viewInfo", "setNickname", {
      viewId,
      nickname: nickname.trim(),
    });
  }

  cleanup() {
    this.isDestroyed = true;
    try {
      // 구독 해제
      this.unsubscribe("history", "refresh", this.handleHistoryRefresh);
      this.unsubscribe("history", "newMessage", this.handleNewMessage);
      this.unsubscribe("viewInfo", "refresh", this.handleViewInfoRefresh);

      // 콜백 정리
      this.onHistoryUpdate = undefined;
      this.onNewMessage = undefined;
      this.onViewInfoUpdate = undefined;

      this.detach();
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }
}

export function ChatViewComponent({ model, session }: ChatViewProps) {
  const [error, setError] = useState<string | null>(null);

  // model이나 session이 null인 경우 처리
  if (!model || !session) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a259ff] mx-auto mb-2"></div>
          <p className="text-gray-300">Initializing chat...</p>
        </div>
      </div>
    );
  }

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
