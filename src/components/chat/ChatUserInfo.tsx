import { CHAT_STYLES } from '@/constants/chat';

interface ChatUserInfoProps {
  nickname: string;
  viewCount: number;
}

export function ChatUserInfo({ nickname, viewCount }: ChatUserInfoProps) {
  return (
    <div className={CHAT_STYLES.userInfo}>
      <div className="text-base text-gray-200 font-medium">
        <span className="opacity-70">Nickname:</span>{' '}
        <span className="text-[#a259ff]">{nickname}</span>
      </div>
      <div className="text-base text-gray-400">
        <span className="opacity-70">Total Views:</span>{' '}
        <span className="text-gray-100">{viewCount}</span>
      </div>
    </div>
  );
} 