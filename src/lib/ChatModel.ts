import { Model } from '@multisynq/client';
import { CHAT_COLORS, CHAT_LIMITS } from '@/constants/chat';

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
    
    // 채팅 이벤트 구독 설정
    this.subscribe("input", "newPost", this.newPost);
    this.subscribe("input", "reset", this.resetHistory);

    // 주기적 정리 작업 시작
    this.startPeriodicCleanup();
  }

  private startPeriodicCleanup() {
    // 5분마다 오래된 데이터 정리
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldData();
    }, 5 * 60 * 1000);
  }

  private cleanupOldData() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30분

    // 비활성 사용자 정리
    for (const [viewId] of this.views) {
      // 채팅방 전체가 30분 이상 비활성 상태인 경우 모든 참여자 제거
      if (now - (this.lastPostTime || 0) > maxAge) {
        this.views.delete(viewId);
        this.viewColors.delete(viewId);
      }
    }

    // 채팅 히스토리 관리
    if (this.history.length > CHAT_LIMITS.MESSAGE_HISTORY_MAX * 0.8) {
      const removeCount = Math.floor(this.history.length * 0.2);
      this.history.splice(0, removeCount);
    }
  }

  private randomColor(): string {
    return CHAT_COLORS[Math.floor(Math.random() * CHAT_COLORS.length)];
  }

  viewJoin(viewId: string) {
    const existing = this.views.get(viewId);
    if (!existing) {
      const nickname = this.randomName();
      this.views.set(viewId, nickname);
    }
    this.viewColors.set(viewId, this.randomColor());
    this.participants++;
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
    if (!post.viewId || typeof post.text !== 'string') {
      console.warn('Invalid post data:', post);
      return;
    }

    // 메시지 길이 제한 및 텍스트 정제
    const maxLength = 1000;
    const sanitizedText = this.sanitizeText(post.text.slice(0, maxLength));
    
    const postingView = post.viewId;
    const nickname = this.views.get(postingView) || 'Unknown';
    const chatLine = `<b><span class="nickname">${this.escapeHtml(nickname)}</span></b> ${this.escapeHtml(sanitizedText)}`;
    
    this.addToHistory({ viewId: postingView, html: chatLine });
    this.lastPostTime = Date.now();
    this.future(this.inactivity_timeout_ms).resetIfInactive();
  }

  private sanitizeText(text: string): string {
    // 보안을 위한 유해 콘텐츠 제거
    return text
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
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

  resetIfInactive() {
    if (this.lastPostTime !== Date.now() - this.inactivity_timeout_ms) return;
    this.resetHistory("due to inactivity");
  }

  resetHistory(reason: string) {
    this.history.length = 0;
    this.lastPostTime = null;
    // 히스토리 리셋 시에는 전체 리프레시
    this.publish("history", "refresh");
  }

  randomName(): string {
    const names = [
      "Acorn", "Birch", "Cedar", "Daisy", "Elm", "Fern", "Grove", "Hazel",
      "Iris", "Juniper", "Kale", "Lily", "Maple", "Nettle", "Oak", "Pine",
      "Quince", "Rose", "Sage", "Thyme", "Umber", "Violet", "Willow", "Yarrow", "Zucchini"
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  // XSS 방지를 위한 HTML 이스케이프 처리
  private escapeHtml(text: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    
    return text.replace(/[&<>"'`=/]/g, (match) => htmlEscapes[match]);
  }

  cleanup() {
    if (this.cleanupTimer) {
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
}

ChatModel.register("ChatModel"); 