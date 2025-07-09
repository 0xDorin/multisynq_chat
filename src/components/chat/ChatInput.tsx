import { CHAT_STYLES } from '@/constants/chat';

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  placeholder?: string;
}

export function ChatInput({ 
  value, 
  onChange, 
  onKeyPress, 
  onSend, 
  placeholder = "Type your message here..." 
}: ChatInputProps) {
  return (
    <div className={CHAT_STYLES.inputContainer}>
      <input
        type="text"
        placeholder={placeholder}
        className={CHAT_STYLES.input}
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
        autoComplete="off"
      />
      <button
        className={CHAT_STYLES.button}
        onClick={onSend}
      >
        Send
      </button>
    </div>
  );
} 