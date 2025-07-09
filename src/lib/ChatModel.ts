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

    // Subscribe to system events
    this.subscribe(this.sessionId, "view-join", this.viewJoin);
    this.subscribe(this.sessionId, "view-exit", this.viewExit);
    
    // Subscribe to chat events
    this.subscribe("input", "newPost", this.newPost);
    this.subscribe("input", "reset", this.resetHistory);

    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  private startPeriodicCleanup() {
    // Clean up old data every 5 minutes
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldData();
    }, 5 * 60 * 1000);
  }

  private cleanupOldData() {
    const now = this.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    // Remove old inactive views
    for (const [viewId] of this.views) {
      // If view hasn't been active for more than 30 minutes, remove it
      if (now - (this.lastPostTime || 0) > maxAge) {
        this.views.delete(viewId);
        this.viewColors.delete(viewId);
      }
    }

    // Limit history size more aggressively if needed
    if (this.history.length > CHAT_LIMITS.MESSAGE_HISTORY_MAX * 0.8) {
      const removeCount = Math.floor(this.history.length * 0.2);
      this.history.splice(0, removeCount);
    }
  }

  private randomColor(): string {
    return CHAT_COLORS[Math.floor(Math.random() * CHAT_COLORS.length)];
  }

  viewJoin = (viewId: string) => {
    const existing = this.views.get(viewId);
    if (!existing) {
      const nickname = this.randomName();
      this.views.set(viewId, nickname);
    }
    this.viewColors.set(viewId, this.randomColor());
    this.participants++;
    this.publish("viewInfo", "refresh");
  }

  viewExit = (viewId: string) => {
    this.participants = Math.max(0, this.participants - 1);
    this.views.delete(viewId);
    this.viewColors.delete(viewId);
    this.publish("viewInfo", "refresh");
  }

  newPost = (post: { viewId: string; text: string }) => {
    // Input validation
    if (!post.viewId || typeof post.text !== 'string') {
      console.warn('Invalid post data:', post);
      return;
    }

    // Text length limit and sanitization
    const maxLength = 1000;
    const sanitizedText = this.sanitizeText(post.text.slice(0, maxLength));
    
    const postingView = post.viewId;
    const nickname = this.views.get(postingView) || 'Unknown';
    const chatLine = `<b><span class="nickname">${this.escapeHtml(nickname)}</span></b> ${this.escapeHtml(sanitizedText)}`;
    
    this.addToHistory({ viewId: postingView, html: chatLine });
    this.lastPostTime = this.now();
    this.future(this.inactivity_timeout_ms).resetIfInactive();
  }

  private sanitizeText(text: string): string {
    // Remove potentially harmful content
    return text
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .trim();
  }

  addToHistory(item: { viewId: string; html: string }) {
    this.history.push(item);
    
    // More aggressive history management
    if (this.history.length > CHAT_LIMITS.MESSAGE_HISTORY_MAX) {
      const removeCount = Math.floor(CHAT_LIMITS.MESSAGE_HISTORY_MAX * 0.1);
      this.history.splice(0, removeCount);
    }
    
    this.publish("history", "refresh");
  }

  resetIfInactive = () => {
    if (this.lastPostTime !== this.now() - this.inactivity_timeout_ms) return;
    this.resetHistory("due to inactivity");
  }

  resetHistory = (reason: string) => {
    this.history.length = 0; // More efficient than assignment
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

  // XSS 방지를 위한 강화된 HTML 이스케이프
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

  // Cleanup method
  cleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    // Clear all data
    this.views.clear();
    this.viewColors.clear();
    this.history.length = 0;
    this.participants = 0;
    this.lastPostTime = null;
  }

  // Getter methods
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