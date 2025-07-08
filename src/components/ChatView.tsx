'use client';

import React, { useEffect, useRef, useState } from 'react';
import { View } from '@multisynq/client';
import { ChatModel } from '@/lib/ChatModel';

interface ChatViewProps {
  model: ChatModel;
}

export class ChatView extends View {
  private model: ChatModel;
  private textIn: HTMLInputElement | null = null;
  private textOut: HTMLDivElement | null = null;
  private nickname: HTMLDivElement | null = null;
  private viewCount: HTMLDivElement | null = null;
  private sendButton: HTMLButtonElement | null = null;

  constructor(model: ChatModel) {
    super(model);
    this.model = model;

    // Subscribe to events
    this.subscribe("history", "refresh", this.refreshHistory);
    this.subscribe("viewInfo", "refresh", this.refreshViewInfo);

    // Initialize display
    this.refreshHistory();
    this.refreshViewInfo();

    // Check if alone and reset if needed
    if (this.model.getParticipants() === 1 &&
        !this.model.getHistory().find(item => item.viewId === this.viewId)) {
      this.publish("input", "reset", "for new participants");
    }
  }

  send() {
    if (!this.textIn) return;
    
    const text = this.textIn.value;
    this.textIn.value = "";
    
    if (text === "/reset") {
      this.publish("input", "reset", "at user request");
    } else {
      this.publish("input", "newPost", { viewId: this.viewId, text });
    }
  }

  refreshViewInfo() {
    if (!this.nickname || !this.viewCount) return;
    
    const views = this.model.getViews();
    const myNickname = views.get(this.viewId);
    const participants = this.model.getParticipants();
    
    this.nickname.innerHTML = `<b>Nickname:</b> ${myNickname}`;
    this.viewCount.innerHTML = `<b>Total Views:</b> ${participants}`;
  }

  refreshHistory() {
    if (!this.textOut) return;
    
    const history = this.model.getHistory();
    const historyHtml = history.map(item => item.html).join("<br>");
    
    this.textOut.innerHTML = `<b>Welcome to Multisynq Chat!</b><br><br>${historyHtml}`;
    this.textOut.scrollTop = Math.max(10000, this.textOut.scrollHeight);
  }

  // React component methods
  setRefs(textIn: HTMLInputElement | null, textOut: HTMLDivElement | null, 
          nickname: HTMLDivElement | null, viewCount: HTMLDivElement | null,
          sendButton: HTMLButtonElement | null) {
    this.textIn = textIn;
    this.textOut = textOut;
    this.nickname = nickname;
    this.viewCount = viewCount;
    this.sendButton = sendButton;

    if (this.sendButton) {
      this.sendButton.onclick = () => this.send();
    }
  }
}

// React wrapper component
export function ChatViewComponent({ model }: ChatViewProps) {
  const [chatView, setChatView] = useState<ChatView | null>(null);
  const textInRef = useRef<HTMLInputElement>(null);
  const textOutRef = useRef<HTMLDivElement>(null);
  const nicknameRef = useRef<HTMLDivElement>(null);
  const viewCountRef = useRef<HTMLDivElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const view = new ChatView(model);
    setChatView(view);

    return () => {
      // Cleanup if needed
    };
  }, [model]);

  useEffect(() => {
    if (chatView) {
      chatView.setRefs(
        textInRef.current,
        textOutRef.current,
        nicknameRef.current,
        viewCountRef.current,
        sendButtonRef.current
      );
    }
  }, [chatView]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      chatView?.send();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Multisynq Chat
        </h1>
        
        {/* User Info */}
        <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded">
          <div ref={nicknameRef} className="text-sm text-gray-600"></div>
          <div ref={viewCountRef} className="text-sm text-gray-600"></div>
        </div>

        {/* Chat History */}
        <div 
          ref={textOutRef}
          className="h-96 overflow-y-auto p-4 bg-gray-50 rounded border mb-4 text-sm text-gray-800"
          style={{ whiteSpace: 'pre-wrap' }}
        ></div>

        {/* Input Area */}
        <div className="flex gap-2">
          <input
            ref={textInRef}
            type="text"
            placeholder="Type your message here..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            onKeyPress={handleKeyPress}
          />
          <button
            ref={sendButtonRef}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Type <code>/reset</code> to clear the chat history</li>
            <li>Press Enter or click Send to post a message</li>
            <li>Chat will automatically reset after 20 minutes of inactivity</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 