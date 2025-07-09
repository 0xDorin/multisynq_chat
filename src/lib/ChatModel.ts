import { Model } from '@multisynq/client';
import { CHAT_COLORS, CHAT_LIMITS } from '@/constants/chat';

export class ChatModel extends Model {
  private views!: Map<string, string>;
  private viewColors!: Map<string, string>;  // 추가: 색상 저장용 Map
  private participants!: number;
  private history!: Array<{ viewId: string; html: string }>;
  private lastPostTime!: number | null;
  private inactivity_timeout_ms!: number;

  init() {
    this.views = new Map();
    this.viewColors = new Map();  // 추가: 색상 Map 초기화
    this.participants = 0;
    this.history = [];
    this.lastPostTime = null;
    this.inactivity_timeout_ms = CHAT_LIMITS.INACTIVITY_TIMEOUT;

    // Subscribe to system events
    this.subscribe(this.sessionId, "view-join", this.viewJoin);
    this.subscribe(this.sessionId, "view-exit", this.viewExit);
    
    // Subscribe to chat events
    this.subscribe("input", "newPost", this.newPost);
    this.subscribe("input", "reset", this.resetHistory);
  }

  // 추가: 랜덤 색상 생성 함수
  private randomColor(): string {
    return CHAT_COLORS[Math.floor(Math.random() * CHAT_COLORS.length)];
  }

  viewJoin(viewId: string) {
    const existing = this.views.get(viewId);
    if (!existing) {
      const nickname = this.randomName();
      this.views.set(viewId, nickname);
    }
    // 매번 새로운 색상 할당
    this.viewColors.set(viewId, this.randomColor());
    this.participants++;
    this.publish("viewInfo", "refresh");
  }

  viewExit(viewId: string) {
    this.participants--;
    this.views.delete(viewId);
    this.viewColors.delete(viewId);  // 추가: 색상 정보 삭제
    this.publish("viewInfo", "refresh");
  }

  newPost(post: { viewId: string; text: string }) {
    const postingView = post.viewId;
    const nickname = this.views.get(postingView);
    const chatLine = `<b><span class=\"nickname\">${this.escape(nickname || '')}</span></b> ${this.escape(post.text)}`;
    this.addToHistory({ viewId: postingView, html: chatLine });
    this.lastPostTime = this.now();
    this.future(this.inactivity_timeout_ms).resetIfInactive();
  }

  addToHistory(item: { viewId: string; html: string }) {
    this.history.push(item);
    if (this.history.length > CHAT_LIMITS.MESSAGE_HISTORY_MAX) this.history.shift();
    this.publish("history", "refresh");
  }

  resetIfInactive() {
    if (this.lastPostTime !== this.now() - this.inactivity_timeout_ms) return;
    this.resetHistory("due to inactivity");
  }

  resetHistory(reason: string) {
    this.history = [{ viewId: "system", html: `<i>chat reset ${reason}</i>` }];
    this.lastPostTime = null;
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

  private escape(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Getter methods for view access
  getViews() {
    return this.views;
  }

  getParticipants() {
    return this.participants;
  }

  getHistory() {
    return this.history;
  }

  // 추가: 색상 getter 메소드
  getViewColor(viewId: string): string {
    return this.viewColors.get(viewId) || "#a259ff";  // 기본 색상 fallback
  }
}

ChatModel.register("ChatModel"); 