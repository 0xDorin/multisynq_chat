import { Model } from '@multisynq/client';

export class ChatModel extends Model {
  private views!: Map<string, string>;
  private participants!: number;
  private history!: Array<{ viewId: string; html: string }>;
  private lastPostTime!: number | null;
  private inactivity_timeout_ms!: number;

  init() {
    this.views = new Map();
    this.participants = 0;
    this.history = [];
    this.lastPostTime = null;
    this.inactivity_timeout_ms = 20 * 60 * 1000; // 20 minutes

    // Subscribe to system events
    this.subscribe(this.sessionId, "view-join", this.viewJoin);
    this.subscribe(this.sessionId, "view-exit", this.viewExit);
    
    // Subscribe to chat events
    this.subscribe("input", "newPost", this.newPost);
    this.subscribe("input", "reset", this.resetHistory);
  }

  viewJoin(viewId: string) {
    const existing = this.views.get(viewId);
    if (!existing) {
      const nickname = this.randomName();
      this.views.set(viewId, nickname);
    }
    this.participants++;
    this.publish("viewInfo", "refresh");
  }

  viewExit(viewId: string) {
    this.participants--;
    this.views.delete(viewId);
    this.publish("viewInfo", "refresh");
  }

  newPost(post: { viewId: string; text: string }) {
    const postingView = post.viewId;
    const nickname = this.views.get(postingView);
    const chatLine = `<b>${nickname}:</b> ${this.escape(post.text)}`;
    this.addToHistory({ viewId: postingView, html: chatLine });
    this.lastPostTime = this.now();
    this.future(this.inactivity_timeout_ms).resetIfInactive();
  }

  addToHistory(item: { viewId: string; html: string }) {
    this.history.push(item);
    if (this.history.length > 100) this.history.shift();
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
}

ChatModel.register("ChatModel"); 