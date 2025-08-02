// use-chat-session-store.ts  – stale-session 방지 버전
import { create } from "zustand";
import { Session, MultisynqSession } from "@multisynq/client";
import { ChatModel } from "@/lib/ChatModel";
import { MULTISYNQ_CONFIG } from "@/config/multisynq";

/* ─────────────────── Types ───────────────────*/
type Entry = { session: MultisynqSession<any>; refs: number };
type ConnectionStatus =
  | "idle"
  | "connecting"
  | "reconnecting"
  | "connected"
  | "failed";

interface ChatSessionStore {
  cache: Record<string, Entry>;
  connectionStatus: Record<string, ConnectionStatus>;
  acquire: (roomId: string) => Promise<MultisynqSession<any>>;
  release: (roomId: string) => void;
  getConnectionStatus: (roomId: string) => ConnectionStatus;
}

/* ───────────── Helpers & attempt tracking ─────────────*/
const pendingJoins = new Map<string, Promise<MultisynqSession<any>>>();
// roomId ➜ latest attempt id
const activeAttemptId = new Map<string, number>();

const attemptSessionJoin = (roomId: string) =>
  Session.join({
    apiKey: MULTISYNQ_CONFIG.apiKey,
    appId: MULTISYNQ_CONFIG.appId,
    name: `chat-${roomId}`,
    password: MULTISYNQ_CONFIG.password,
    model: ChatModel,
  });

const joinWithTimeout = async (roomId: string, timeoutMs: number) => {
  const joinPromise = attemptSessionJoin(roomId);

  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("Connection timeout")),
      timeoutMs
    );
  });

  return Promise.race([joinPromise, timeoutPromise])
    .finally(() => clearTimeout(timer))
    .catch((err) => {
      // race 에서 joinPromise 가 졌을 때는 아직 끝나지 않았으므로,
      // 나중에 성공해도 유령 세션이 되지 않도록 정리.
      joinPromise
        .then((s) => {
          try {
            s.leave();
          } catch (e) {
            console.warn("[ChatSessionStore] stale join cleanup failed:", e);
          }
        })
        .catch(() => {
          /* 무시 – 이미 실패한 join */
        });
      throw err;
    });
};

const connectWithRetry = async (
  roomId: string,
  updateStatus: (s: ConnectionStatus) => void,
  maxAttempts = 3,
  initialTimeout = 3_000,
  maxTimeout = 8_000
) => {
  // 현재 connect 호출 고유 ID
  const attemptId = (activeAttemptId.get(roomId) ?? 0) + 1;
  activeAttemptId.set(roomId, attemptId);
  const isStale = () => activeAttemptId.get(roomId) !== attemptId;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    updateStatus(attempt === 1 ? "connecting" : "reconnecting");
    try {
      const s = await joinWithTimeout(
        roomId,
        Math.min(initialTimeout * attempt, maxTimeout)
      );

      // 뒤늦게 성공한(=stale) 세션은 즉시 종료
      if (isStale()) {
        s.leave();
        throw new Error("Stale attempt discarded");
      }

      updateStatus("connected");
      return s;
    } catch (err) {
      if (isStale()) throw err; // 최신 시도가 이미 진행 중
      if (attempt === maxAttempts) {
        updateStatus("failed");
        throw err;
      }
      await new Promise((r) =>
        setTimeout(r, Math.min(1_000 * 2 ** (attempt - 1), 2_000))
      );
    }
  }
  throw new Error("Unreachable");
};

/* ─────────────────── Store ───────────────────*/
export const useChatSessionStore = create<ChatSessionStore>((set, get) => ({
  cache: {},
  connectionStatus: {},

  getConnectionStatus: (roomId) => get().connectionStatus[roomId] ?? "idle",

  /* -------- acquire --------*/
  acquire: async (roomId) => {
    const state = get();
    const cached = state.cache[roomId];
    if (cached) {
      set({
        cache: {
          ...state.cache,
          [roomId]: { ...cached, refs: cached.refs + 1 },
        },
      });
      return cached.session;
    }

    const existing = pendingJoins.get(roomId);
    if (existing) return existing;

    const updateStatus = (status: ConnectionStatus) =>
      set((prev) => ({
        connectionStatus: { ...prev.connectionStatus, [roomId]: status },
      }));

    const joinPromise = connectWithRetry(roomId, updateStatus)
      .then((session) => {
        set((prev) => ({
          cache: { ...prev.cache, [roomId]: { session, refs: 1 } },
        }));
        pendingJoins.delete(roomId);
        return session;
      })
      .catch((err) => {
        pendingJoins.delete(roomId);
        throw err;
      });

    pendingJoins.set(roomId, joinPromise);
    return joinPromise;
  },

  /* -------- release --------*/
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
