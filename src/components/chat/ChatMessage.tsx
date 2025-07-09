import { ChatMessage as ChatMessageType } from '@/types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  color: string;
}

export function ChatMessage({ message, color }: ChatMessageProps) {
  // 메시지 파싱
  const match = message.html.match(/^<b><span class=\"nickname\">(.*?)<\/span><\/b> (.*)$/);
  
  if (match) {
    const [, nickname, text] = match;
    return (
      <div className="mb-1">
        <b><span style={{ color }}>{nickname}</span></b>{' '}
        <span className="text-gray-100">{text}</span>
      </div>
    );
  }

  // fallback: 그냥 html로 렌더
  return (
    <div
      dangerouslySetInnerHTML={{ __html: message.html }}
      className="mb-1 text-gray-100"
    />
  );
} 