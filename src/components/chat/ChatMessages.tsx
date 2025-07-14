import { useEffect, useRef, memo } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatMessage as ChatMessageType } from "@/types/chat";

interface ChatMessagesProps {
  history: ChatMessageType[];
  getMessageColor: (viewId: string) => string;
}

export const ChatMessages = memo(function ChatMessages({
  history,
  getMessageColor,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  return (
    <div
      className="flex-1 overflow-y-auto p-4 text-sm text-gray-100"
      style={{ backgroundColor: "#181828" }}
    >
      {history.map((message, idx) => (
        <ChatMessage
          key={`${idx}-${message.viewId}-${message.html.length}`}
          message={message}
          color={getMessageColor(message.viewId)}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
});
