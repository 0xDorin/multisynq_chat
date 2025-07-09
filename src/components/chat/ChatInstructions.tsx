import { CHAT_STYLES, CHAT_COMMANDS } from '@/constants/chat';

export function ChatInstructions() {
  return (
    <div className={CHAT_STYLES.instructions}>
      <p className="font-semibold text-[#a259ff] mb-1">Instructions:</p>
      <ul className="list-disc list-inside mt-1 space-y-1">
        <li>
          Type <code className="text-[#a259ff]">{CHAT_COMMANDS.RESET}</code> to clear the chat history
        </li>
        <li>Press Enter or click Send to post a message</li>
        <li>Chat will automatically reset after 20 minutes of inactivity</li>
      </ul>
    </div>
  );
} 