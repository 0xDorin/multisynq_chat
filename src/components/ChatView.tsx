"use client";

import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatViewProps } from "@/types/chat";

export function ChatViewComponent({ model, session }: ChatViewProps) {
  // model이나 session이 null인 경우 처리는 LiveChatToggle에서 함
  if (!model || !session) return null;

  return (
    <ChatContainer
      model={model}
      session={session}
      viewId={session.view.viewId}
    />
  );
}
