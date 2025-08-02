// src/stores/use-chat-session-store.ts
import { create } from "zustand";
import { MultisynqSession } from "@multisynq/client";
import { connectWithRetry, ConnectionStatus } from "@/hooks/useChatSession";

/* ─────────────────── Types ───────────────────*/
type Entry = { session: MultisynqSession<any>; refs: number };
interface ChatSessionStore {
  cache: Record<string, Entry>;
  connectionStatus: Record<string, ConnectionStatus | "idle">;
  acquire: (roomId: string) => Promise<MultisynqSession<any>>;
  release: (roomId: string) => void;
  getConnectionStatus: (roomId: string) => ConnectionStatus | "idle";
}

/* ─────────────────── Store ───────────────────*/
export const useChatSessionStore = create<ChatSessionStore>((set, get) => ({
  cache: {},
  connectionStatus: {},

  getConnectionStatus: (roomId) => get().connectionStatus[roomId] ?? "idle",

  acquire: async (roomId) => {
    const state = get();
    const cached = state.cache[roomId];
    if (cached) {
      // ref++ 후 반환
      set({
        cache: {
          ...state.cache,
          [roomId]: { ...cached, refs: cached.refs + 1 },
        },
      });
      return cached.session;
    }

    // 새 연결
    const joinPromise = connectWithRetry(roomId, (status) =>
      set((prev) => ({
        connectionStatus: { ...prev.connectionStatus, [roomId]: status },
      }))
    ).then((session) => {
      set((prev) => ({
        cache: { ...prev.cache, [roomId]: { session, refs: 1 } },
      }));
      return session;
    });

    return joinPromise;
  },

  release: (roomId) => {
    const state = get();
    const entry = state.cache[roomId];
    if (!entry) return;

    const refs = Math.max(0, entry.refs - 1);
    if (refs === 0) {
      try {
        entry.session.leave();
      } catch (e) {
        console.error("[ChatSessionStore] leave() error:", e);
      }
      const { [roomId]: _c, ...restCache } = state.cache;
      const { [roomId]: _s, ...restStatus } = state.connectionStatus;
      set({ cache: restCache, connectionStatus: restStatus });
    } else {
      entry.session.view.detach();
      set({
        cache: { ...state.cache, [roomId]: { ...entry, refs } },
      });
    }
  },
}));
