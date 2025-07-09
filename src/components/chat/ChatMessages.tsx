import { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { CHAT_STYLES } from '@/constants/chat';

interface ChatMessagesProps {
  history: ChatMessageType[];
  getMessageColor: (viewId: string) => string;
}

export function ChatMessages({ history, getMessageColor }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 채팅 스크롤 자동 아래로
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div
      ref={messagesEndRef}
      className={CHAT_STYLES.messagesContainer}
      style={{ whiteSpace: 'pre-wrap' }}
    >
      <div className="mb-2 text-[#a259ff] font-semibold">
        Welcome to Multisynq Chat!
      </div>
      {history.map((message, idx) => (
        <ChatMessage
          key={idx}
          message={message}
          color={getMessageColor(message.viewId)}
        />
      ))}
    </div>
  );
} 