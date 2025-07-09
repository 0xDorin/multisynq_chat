import { ChatMessage as ChatMessageType } from '@/types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  color: string;
}

export function ChatMessage({ message, color }: ChatMessageProps) {
  // Parse message HTML
  const match = message.html.match(/^<b><span class=\"nickname\">(.*?)<\/span><\/b> (.*)$/);
  
  if (match) {
    const [, nickname, text] = match;
    return (
      <div className="mb-2">
        <b><span style={{ color }}>{nickname}</span></b>{' '}
        <span className="text-gray-100">{text}</span>
      </div>
    );
  }

  // Fallback: render as HTML for system messages
  return (
    <div
      dangerouslySetInnerHTML={{ __html: message.html }}
      className="mb-2 text-gray-100"
    />
  );
} 