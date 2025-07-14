"use client";

import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { useChatView } from "@/hooks/useChatView";
import { ChatViewProps } from "@/types/chat";
import { CHAT_STYLES } from "@/constants/chat";

export function ChatContainer({ model, session }: ChatViewProps) {
  const {
    history,
    displayNickname,
    viewCount,
    input,
    handleInputChange,
    handleSend,
    handleKeyPress,
    model: chatModel,
  } = useChatView({ model, session });

  // chatModel이 null인 경우 처리
  if (!chatModel) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a259ff] mx-auto mb-2"></div>
          <p className="text-gray-300">Loading chat model...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={CHAT_STYLES.container}>
      <div className={CHAT_STYLES.chatBox}>
        <ChatMessages
          history={history}
          getMessageColor={(viewId) => chatModel.getViewColor(viewId)}
        />

        <ChatInput
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onSend={handleSend}
          disabled={!chatModel.canSendMessage()}
        />
      </div>
    </div>
  );
}
