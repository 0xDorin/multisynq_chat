// use-chat-session-store.ts
import { create } from "zustand";
import { Session, MultisynqSession } from "@multisynq/client";
import { ChatModel } from "@/lib/ChatModel";
import { MULTISYNQ_CONFIG } from "@/config/multisynq";

type Entry = {
  session: MultisynqSession<any>;
  refs: number;
};

interface ChatSessionStore {
  cache: Record<string, Entry>;
  acquire: (roomId: string) => Promise<MultisynqSession<any>>;
  release: (roomId: string) => void;
}

export const useChatSessionStore = create<ChatSessionStore>((set, get) => ({
  cache: {},
  acquire: async (roomId) => {
    const { cache } = get();
    if (cache[roomId]) {
      cache[roomId].refs += 1;
      return cache[roomId].session;
    }
    const s = await Session.join({
      apiKey: MULTISYNQ_CONFIG.apiKey,
      appId: MULTISYNQ_CONFIG.appId,
      name: `chat-${roomId}`,
      password: MULTISYNQ_CONFIG.password,
      model: ChatModel,
    });
    cache[roomId] = { session: s, refs: 1 };
    set({ cache });
    return s;
  },
  release: (roomId) => {
    const { cache } = get();
    const entry = cache[roomId];
    if (!entry) return;
    entry.refs = Math.max(0, entry.refs - 1);

    if (entry.refs <= 0) {
      entry.session.leave(); // 🔥 완전 종료
      delete cache[roomId];
    } else {
      entry.session.view.detach(); // 🔕 뷰만 끊기
    }
    set({ cache });
  },
}));
