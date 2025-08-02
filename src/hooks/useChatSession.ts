// src/services/multisynqClient.ts
import { Session, MultisynqSession } from "@multisynq/client";
import { ChatModel } from "@/lib/ChatModel";
import { MULTISYNQ_CONFIG } from "@/config/multisynq";

const activeAttemptId = new Map<string, number>();

/* ─────────────────── Types ───────────────────*/
export type ConnectionStatus =
  | "connecting"
  | "reconnecting"
  | "connected"
  | "failed";

export async function attemptJoin(roomId: string) {
  return Session.join({
    apiKey: MULTISYNQ_CONFIG.apiKey,
    appId: MULTISYNQ_CONFIG.appId,
    name: `chat-${roomId}`,
    password: MULTISYNQ_CONFIG.password,
    model: ChatModel,
  });
}

/**
 * `attemptJoin` 에 4 초 타임아웃(최초 시도 기준) 걸기.
 * race 에서 진 프라미스가 나중에 성공하더라도 s.leave() 로 정리.
 */
export async function joinWithTimeout(
  roomId: string,
  timeoutMs = 4_000
): Promise<MultisynqSession<any>> {
  const joinPromise = attemptJoin(roomId);

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
      // 패배한 joinPromise 정리
      joinPromise.then((s) => s.leave()).catch(() => {});
      throw err;
    });
}

export async function connectWithRetry(
  roomId: string,
  updateStatus: (s: ConnectionStatus) => void,
  { maxAttempts = 3, initialTimeout = 4_000, maxTimeout = 8_000 } = {}
): Promise<MultisynqSession<any>> {
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

      if (isStale()) {
        s.leave();
        throw new Error("Stale attempt discarded");
      }
      updateStatus("connected");
      return s;
    } catch (err) {
      if (isStale()) throw err;
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
}
