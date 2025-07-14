import { create } from "zustand";
import { MultisynqSession } from "@multisynq/client";
import { ChatModel } from "@/lib/ChatModel";

interface SessionData {
  session: MultisynqSession<any>;
  roomId: string;
  viewId: string;
}

interface ChatSessionState {
  sessions: Map<string, SessionData>;
  setSession: (roomId: string, session: MultisynqSession<any>) => void;
  getSession: (roomId: string) => SessionData | null;
  clearSession: (roomId: string) => void;
}

export const useChatSessionStore = create<ChatSessionState>((set, get) => ({
  sessions: new Map<string, SessionData>(),

  setSession: (roomId: string, session: MultisynqSession<any>) => {
    set((state) => ({
      sessions: new Map(state.sessions).set(roomId, {
        session,
        roomId,
        viewId: session.view.id,
      }),
    }));
  },

  getSession: (roomId: string) => {
    return get().sessions.get(roomId) || null;
  },

  clearSession: (roomId: string) => {
    set((state) => {
      const newSessions = new Map(state.sessions);
      newSessions.delete(roomId);
      return { sessions: newSessions };
    });
  },
}));
