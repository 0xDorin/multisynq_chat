'use client';

import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { useChatView } from '@/hooks/useChatView';
import { ChatViewProps } from '@/types/chat';
import { CHAT_STYLES } from '@/constants/chat';

export function ChatContainer({ model, session }: ChatViewProps) {
  const {
    history,
    displayNickname,
    viewCount,
    input,
    handleInputChange,
    handleSend,
    handleKeyPress,
    model: chatModel
  } = useChatView({ model, session });

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
        />
      </div>
    </div>
  );
} 