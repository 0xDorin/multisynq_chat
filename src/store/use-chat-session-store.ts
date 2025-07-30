// use-chat-session-store.ts
import { create } from "zustand";
import { Session, MultisynqSession } from "@multisynq/client";
import { ChatModel } from "@/lib/ChatModel";
import { MULTISYNQ_CONFIG } from "@/config/multisynq";

type Entry = {
  session: MultisynqSession<any>;
  refs: number;
};

type ConnectionStatus =
  | "idle"
  | "connecting"
  | "reconnecting"
  | "connected"
  | "failed";

const joinWithTimeout = (
  roomId: string,
  timeoutMs: number
): Promise<MultisynqSession<any>> =>
  new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout | null = setTimeout(() => {
      timer = null; // timeout 발생 표시
      reject(new Error("Connection timeout"));
    }, timeoutMs);

    attemptSessionJoin(roomId)
      .then((s) => {
        if (timer === null) {
          // 이미 timeout 됐으므로 사용하지 않고 즉시 정리
          s.leave();
          return;
        }
        clearTimeout(timer);
        resolve(s);
      })
      .catch((err) => {
        if (timer !== null) clearTimeout(timer);
        reject(err);
      });
  });

interface ChatSessionStore {
  cache: Record<string, Entry>;
  connectionStatus: Record<string, ConnectionStatus>;
  acquire: (roomId: string) => Promise<MultisynqSession<any>>;
  release: (roomId: string) => void;
  getConnectionStatus: (roomId: string) => ConnectionStatus;
}

// 세션 연결 시도 함수
const attemptSessionJoin = async (
  roomId: string
): Promise<MultisynqSession<any>> => {
  return await Session.join({
    apiKey: MULTISYNQ_CONFIG.apiKey,
    appId: MULTISYNQ_CONFIG.appId,
    name: `chat-${roomId}`,
    password: MULTISYNQ_CONFIG.password,
    model: ChatModel,
  });
};

// 재시도 로직이 포함된 세션 연결 함수
const connectWithRetry = async (
  roomId: string,
  updateStatus: (status: ConnectionStatus) => void,
  maxAttempts = 3
): Promise<MultisynqSession<any>> => {
  const INITIAL_TIMEOUT = 3000; // 3초로 단축
  const MAX_TIMEOUT = 8000; // 8초로 단축

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // 상태 업데이트
      if (attempt === 1) {
        updateStatus("connecting");
      } else {
        updateStatus("reconnecting");
      }

      // 타임아웃 시간을 점진적으로 증가 (3초 → 6초 → 8초)
      const timeout = Math.min(INITIAL_TIMEOUT * attempt, MAX_TIMEOUT);
      const session = await joinWithTimeout(roomId, timeout);

      updateStatus("connected");
      return session;
    } catch (error) {
      console.warn(`Chat connection attempt ${attempt} failed:`, error);

      // 마지막 시도에서 실패하면 에러를 던짐
      if (attempt === maxAttempts) {
        updateStatus("failed");
        throw new Error(
          `Failed to connect to chat after ${maxAttempts} attempts`
        );
      }

      // 재시도 전에 지수 백오프로 대기 (1초 → 2초)
      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 2000);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  updateStatus("failed");
  throw new Error("Unexpected error in connection retry logic");
};

export const useChatSessionStore = create<ChatSessionStore>((set, get) => ({
  cache: {},
  connectionStatus: {},

  getConnectionStatus: (roomId: string) => {
    const { connectionStatus } = get();
    return connectionStatus[roomId] || "idle";
  },

  acquire: async (roomId) => {
    const { cache, connectionStatus } = get();

    if (cache[roomId]) {
      cache[roomId].refs += 1;
      return cache[roomId].session;
    }

    const updateStatus = (status: ConnectionStatus) => {
      set((state) => ({
        connectionStatus: {
          ...state.connectionStatus,
          [roomId]: status,
        },
      }));
    };

    try {
      const s = await connectWithRetry(roomId, updateStatus);
      cache[roomId] = { session: s, refs: 1 };
      set({ cache });
      return s;
    } catch (error) {
      console.error("Failed to establish chat connection:", error);
      updateStatus("failed");
      throw error; // 상위에서 처리할 수 있도록 에러를 전파
    }
  },

  release: (roomId) => {
    const { cache } = get();
    const entry = cache[roomId];
    if (!entry) return;
    entry.refs = Math.max(0, entry.refs - 1);

    if (entry.refs <= 0) {
      entry.session.leave(); // 🔥 완전 종료
      delete cache[roomId];

      // 연결 상태도 정리
      set((state) => {
        const newConnectionStatus = { ...state.connectionStatus };
        delete newConnectionStatus[roomId];
        return { connectionStatus: newConnectionStatus };
      });
    } else {
      entry.session.view.detach(); // 🔕 뷰만 끊기
    }
    set({ cache });
  },
}));
