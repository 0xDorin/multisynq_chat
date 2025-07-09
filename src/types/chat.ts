import { View } from '@multisynq/client';

export interface ChatMessage {
  viewId: string;
  html: string;
}

export interface ChatViewProps {
  model: View;
  session?: any; // MultisynqSession 타입
} 