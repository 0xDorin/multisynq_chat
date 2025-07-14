"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Session, type MultisynqSession } from "@multisynq/client";
import { ChatModel } from "@/lib/ChatModel";
import { ChatViewComponent } from "./ChatView";
import { MULTISYNQ_CONFIG } from "@/config/multisynq";
import { useChatSessionStore } from "@/store/use-chat-session-store";

interface LiveChatToggleProps {
  roomId: string;
  position?: "bottom-right" | "bottom-left";
  nickname?: string;
}

export function LiveChatToggle({
  roomId,
  position = "bottom-right",
  nickname,
}: LiveChatToggleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [session, setSession] = useState<MultisynqSession<any> | null>(null);
  const [model, setModel] = useState<ChatModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { getSession, setSession: storeSetSession } = useChatSessionStore();

  const initializeChat = useCallback(async () => {
    if (session || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      // store에서 기존 세션 확인
      const storedSession = getSession(roomId);

      if (storedSession) {
        // 저장된 세션이 있으면 그것을 사용
        setSession(storedSession.session);
        const rootModel = storedSession.session.view.wellKnownModel(
          "modelRoot"
        ) as ChatModel;
        setModel(rootModel);
        return;
      }

      // 저장된 세션이 없으면 새로 생성
      const sessionResult = await Session.join({
        apiKey: MULTISYNQ_CONFIG.apiKey,
        appId: MULTISYNQ_CONFIG.appId,
        name: `chat-${roomId}`,
        password: MULTISYNQ_CONFIG.password,
        model: ChatModel,
      });

      if (!mountedRef.current) return;

      // 새로운 세션을 store에 저장
      storeSetSession(roomId, sessionResult);

      setSession(sessionResult);
      const rootModel = sessionResult.view.wellKnownModel(
        "modelRoot"
      ) as ChatModel;
      setModel(rootModel);

      sessionResult.view.publish("viewInfo", "setNickname", {
        viewId: sessionResult.view.viewId,
        nickname: nickname,
      });

      console.log("init session nickname", session, nickname);
    } catch (err) {
      if (!mountedRef.current) return;

      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect to session";
      setError(errorMessage);
      console.error("Connection error:", err);

      // Retry connection after 3 seconds
      retryTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          initializeChat();
        }
      }, 3000);
    } finally {
      if (mountedRef.current) {
        setIsConnecting(false);
      }
    }
  }, [roomId, session, isConnecting, getSession, storeSetSession]);

  useEffect(() => {
    if (session && nickname) {
      console.log("session nickname useEffect", session, nickname);
      session.view.publish("viewInfo", "setNickname", {
        viewId: session.view.viewId,
        nickname: nickname,
      });
    }
  }, [session, nickname]);

  // Initialize chat on mount
  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  // Scroll to bottom when chat becomes visible
  useEffect(() => {
    if (isVisible && chatContainerRef.current) {
      const scrollToBottom = () => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      };

      // Use requestAnimationFrame for better performance
      requestAnimationFrame(scrollToBottom);
    }
  }, [isVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      if (model) {
        model.cleanup();
      }

      if (session) {
        session.view.detach();
      }
    };
  }, [model, session]);

  const handleToggle = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setSession(null);
    setModel(null);
    initializeChat();
  }, [initializeChat]);

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className={`fixed ${positionClasses[position]} z-50 w-14 h-14 bg-[#a259ff] hover:bg-[#b084fa] text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center`}
        aria-label={isVisible ? "Close chat" : "Open chat"}
      >
        {isVisible ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
      </button>

      {/* Chat window */}
      <div
        className={`fixed ${
          positionClasses[position]
        } z-40 w-[500px] h-[700px] bg-[#181828] rounded-lg shadow-2xl mb-20 mr-2 transition-all duration-300 ${
          isVisible
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        ref={chatContainerRef}
      >
        {error ? (
          <div className="p-4 h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 mb-2">Connection Error</p>
              <p className="text-gray-400 text-sm mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-[#a259ff] text-white rounded hover:bg-[#b084fa] transition-colors"
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Retry"}
              </button>
            </div>
          </div>
        ) : !session || !model || isConnecting ? (
          <div className="p-4 h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a259ff] mx-auto mb-2"></div>
              <p className="text-gray-300">Connecting to chat...</p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-hidden rounded-lg">
            <ChatViewComponent model={session.view} session={session} />
          </div>
        )}
      </div>
    </>
  );
}
