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
    // 메시지 수가 많을 때만 정리 작업 실행
    // 정리 주기를 동적으로 조정
    this.scheduleCleanup();
  }

  private scheduleCleanup() {
    // 메시지가 80개 이상이면 즉시 정리, 아니면 5분 후 재확인
    const checkInterval = this.history.length > 80 ? 0 : 5 * 60 * 1000;
    
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
    }
    
    this.cleanupTimer = setTimeout(() => {
      this.cleanupOldData();
      this.scheduleCleanup(); // 다음 정리 예약
    }, checkInterval);
  }

  private cleanupOldData(): void {
    const MAX_MESSAGES = 100; // 최대 100개 메시지만 유지
    const OPTIMAL_MESSAGES = 80; // 정리 후 80개 유지
    
    // 메시지 수 기반 정리
    if (this.history.length > MAX_MESSAGES) {
      // 오래된 메시지부터 삭제하여 OPTIMAL_MESSAGES 개만 유지
      const keepCount = OPTIMAL_MESSAGES;
      const removeCount = this.history.length - keepCount;
      
      this.history.splice(0, removeCount);
      
      // 전체 리프레시 알림
      this.publish("history", "refresh");
    }
    
    // 비활성 사용자 정리는 제거 (Multisynq가 viewExit으로 알아서 처리)
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
    const MAX_MESSAGES = 100; // 최대 100개 메시지
    
    this.history.push(item);

    // 메시지 수가 최대치를 넘으면 즉시 정리
    if (this.history.length > MAX_MESSAGES) {
      // 오래된 메시지 20개 삭제 (버퍼 유지)
      const removeCount = 20;
      this.history.splice(0, removeCount);
      
      // 메시지 삭제 시 전체 리프레시
      this.publish("history", "refresh");
      
      // 정리 스케줄 재조정
      this.scheduleCleanup();
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
      clearTimeout(this.cleanupTimer);
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
