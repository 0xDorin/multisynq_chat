import { useState, useEffect, useCallback } from 'react';
import { ChatView } from '@/components/ChatView';
import { ChatModel } from '@/lib/ChatModel';
import { ChatMessage, ChatViewInfo } from '@/types/chat';
import { CHAT_LIMITS } from '@/constants/chat';

interface UseChatViewProps {
  model: ChatModel;
  session?: any;
}

export function useChatView({ model, session }: UseChatViewProps) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [nickname, setNickname] = useState<string>('');
  const [viewCount, setViewCount] = useState<number>(1);
  const [input, setInput] = useState('');
  const [chatView, setChatView] = useState<ChatView | null>(null);

  // ChatView 인스턴스 생성 및 콜백 연결
  useEffect(() => {
    if (!model) return;

    const view = new ChatView(model);
    
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

  // 닉네임 처리
  const realNickname = nickname || (
    session?.view?.viewId ? model.getViews().get(session.view.viewId) : ''
  ) || 'Loading...';

  const displayNickname = realNickname.length > CHAT_LIMITS.NICKNAME_DISPLAY_LENGTH 
    ? realNickname.slice(0, CHAT_LIMITS.NICKNAME_DISPLAY_LENGTH) + '...' 
    : realNickname;

  return {
    history,
    displayNickname,
    viewCount,
    input,
    handleInputChange,
    handleSend,
    handleKeyPress,
    model
  };
} 