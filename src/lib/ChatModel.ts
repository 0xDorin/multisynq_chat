import { Model } from "@multisynq/client";
import { CHAT_COLORS, CHAT_LIMITS } from "@/constants/chat";

export class ChatModel extends Model {
  private views!: Map<string, string>;
  private viewColors!: Map<string, string>;
  private participants!: number;
  private history!: Array<{ viewId: string; html: string }>;
  private lastPostTime!: number | null;
  private inactivity_timeout_ms!: number;
  private cleanupTimer: NodeJS.Timeout | null = null;

  init() {
    this.views = new Map();
    this.viewColors = new Map();
    this.participants = 0;
    this.history = [];
    this.lastPostTime = null;
    this.inactivity_timeout_ms = CHAT_LIMITS.INACTIVITY_TIMEOUT;

    // 시스템 이벤트 구독 설정
    this.subscribe(this.sessionId, "view-join", this.viewJoin);
    this.subscribe(this.sessionId, "view-exit", this.viewExit);
    this.subscribe("viewInfo", "setNickname", this.handleNickname);

    // 채팅 이벤트 구독 설정
    this.subscribe("input", "newPost", this.newPost);
    this.subscribe("input", "reset", this.resetHistory);

    // 주기적 정리 작업 시작
    this.startPeriodicCleanup();
  }

  handleNickname({ viewId, nickname }: { viewId: string; nickname?: string }) {
    const trimmed = nickname?.trim() || "Guest";
    this.views.set(viewId, trimmed);
    if (!this.viewColors.has(viewId))
      this.viewColors.set(viewId, this.randomColor());
    this.publish("viewInfo", "refresh");
  }

  private startPeriodicCleanup() {
    // 5분마다 오래된 데이터 정리
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldData();
    }, 5 * 60 * 1000);
  }

  private cleanupOldData(): void {
    const now: number    = this.now();                   // Croquet 가상시간은 number
    const maxAge: number = 30 * 60 * 1000;             // 30분 (밀리초)

    // 비활성 사용자 정리
    for (const viewId of this.views.keys()) {
      // now( number ) - lastPostTime( number ) 이므로 TS 에러 없음
      if (now - (this.lastPostTime || 0) > maxAge) {
        this.views.delete(viewId);
        this.viewColors.delete(viewId);
      }
    }

    // 채팅 히스토리 관리
    const historyMax = CHAT_LIMITS.MESSAGE_HISTORY_MAX; 
    if (this.history.length > historyMax * 0.8) {
      const removeCount: number = Math.floor(this.history.length * 0.2);
      this.history.splice(0, removeCount);
    }

    // 다음 실행 예약 (예: 5분 후)
    this.future(5 * 60 * 1000, "cleanupOldData");
  }

  private randomColor(): string {
    return CHAT_COLORS[Math.floor(Math.random() * CHAT_COLORS.length)];
  }

  viewJoin(viewId: string) {
    const isNew = !this.views.has(viewId);

    this.views.set(viewId, "Guest");
    if (isNew) this.participants++;

    if (!this.viewColors.has(viewId)) {
      this.viewColors.set(viewId, this.randomColor());
    }
    this.publish("viewInfo", "refresh");
  }

  viewExit(viewId: string) {
    this.participants = Math.max(0, this.participants - 1);
    this.views.delete(viewId);
    this.viewColors.delete(viewId);
    this.publish("viewInfo", "refresh");
  }

  newPost(post: { viewId: string; text: string }) {
    // 입력값 검증
    if (!post.viewId || typeof post.text !== "string") {
      console.warn("Invalid post data:", post);
      return;
    }

    // 메시지 길이 제한 및 텍스트 정제
    const maxLength = 1000;
    const sanitizedText = this.sanitizeText(post.text.slice(0, maxLength));

    const postingView = post.viewId;
    const nickname = this.views.get(post.viewId) || "Guest";
    const chatLine = `<b><span class="nickname">${nickname}</span></b> ${sanitizedText}`;

    this.addToHistory({ viewId: postingView, html: chatLine });
    this.lastPostTime = this.now();
  }

  private sanitizeText(text: string): string {
    // 보안을 위한 유해 콘텐츠 제거
    return text
      .replace(/javascript:/gi, "")
      .replace(/data:/gi, "")
      .replace(/vbscript:/gi, "")
      .trim();
  }

  addToHistory(item: { viewId: string; html: string }) {
    this.history.push(item);

    // 메시지 히스토리 관리 및 이벤트 발행
    if (this.history.length > CHAT_LIMITS.MESSAGE_HISTORY_MAX) {
      const removeCount = Math.floor(CHAT_LIMITS.MESSAGE_HISTORY_MAX * 0.1);
      this.history.splice(0, removeCount);
      // 메시지 삭제 시에만 전체 리프레시
      this.publish("history", "refresh");
    } else {
      // 새 메시지 추가 시에는 개별 이벤트 발행
      this.publish("history", "newMessage", item);
    }
  }

  resetHistory(reason: string) {
    this.history.length = 0;
    this.lastPostTime = null;
    // 히스토리 리셋 시에는 전체 리프레시
    this.publish("history", "refresh");
  }

  cleanup() {
    if (this.cleanupTimer) {
      if (this.participants > 0) return;
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // 모든 데이터 초기화
    this.views.clear();
    this.viewColors.clear();
    this.history.length = 0;
    this.participants = 0;
    this.lastPostTime = null;
  }

  // Getter 메서드들
  getViews() {
    return this.views;
  }

  getParticipants() {
    return this.participants;
  }

  getHistory() {
    return this.history;
  }

  getViewColor(viewId: string): string {
    if (viewId === "system") return "#a259ff";
    return this.viewColors.get(viewId) || "#a259ff";
  }

  canSendMessage(viewId: string): boolean {
    return this.views.get(viewId) !== "Guest";
  }
}

ChatModel.register("ChatModel");
