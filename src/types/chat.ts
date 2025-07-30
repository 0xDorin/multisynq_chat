import { ChatModel } from "@/lib/ChatModel";
import { MultisynqSession } from "@multisynq/client";

export interface ChatMessage {
  viewId: string;
  html: string;
}

export interface ChatViewProps {
  model: ChatModel;
  session: MultisynqSession<any>;
  viewId?: string;
}
