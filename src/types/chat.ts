export interface ChatMessage {
  viewId: string;
  html: string;
}

export interface ChatViewInfo {
  nickname: string;
  viewCount: number;
}

export interface ParsedMessage {
  nickname: string;
  text: string;
  color: string;
}

export interface ChatViewProps {
  model: any; // ChatModel 타입
  session?: any; // MultisynqSession 타입
}

export interface ChatViewCallbacks {
  onHistoryUpdate: (history: ChatMessage[]) => void;
  onViewInfoUpdate: (nickname: string, viewCount: number) => void;
} 