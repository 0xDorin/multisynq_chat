"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { type MultisynqSession } from "@multisynq/client";
import { ChatModel } from "@/lib/ChatModel";
import { ChatViewComponent } from "./ChatView";
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
  /* ────────────────────────────── State & refs */
  const [isVisible, setIsVisible] = useState(false);
  const [session, setSession] = useState<MultisynqSession<any> | null>(null);
  const [model, setModel] = useState<ChatModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  /** Holds the *latest* session regardless of stale closures */
  const sessionRef = useRef<MultisynqSession<any> | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { acquire, release, getConnectionStatus } = useChatSessionStore();
  const connectionStatus = getConnectionStatus(roomId);
  const isConnecting =
    connectionStatus === "connecting" || connectionStatus === "reconnecting";

  /* ────────────────────────────── Helpers */
  const cleanupSession = useCallback(() => {
    if (sessionRef.current) {
      release(roomId);
      sessionRef.current = null;
    }
    setSession(null);
    setModel(null);
  }, [release, roomId]);

  const handleToggle = () => setIsVisible((v) => !v);
  const handleRetry = () => {
    setError(null);
    setRetryKey((k) => k + 1);
  };

  const positionClasses = useMemo<
    Record<"bottom-right" | "bottom-left", string>
  >( // prettier‑ignore
    () => ({
      "bottom-right": "bottom-4 right-4",
      "bottom-left": "bottom-4 left-4",
    }),
    []
  );

  const getConnectionMessage = () => {
    switch (connectionStatus) {
      case "connecting":
        return "Connecting to chat...";
      case "reconnecting":
        return "Reconnecting to chat...";
      case "connected":
        return "Connected";
      case "failed":
        return "Connection failed";
      default:
        return "Connecting to chat...";
    }
  };

  /* ────────────────────────────── Acquire / release session */
  useEffect(() => {
    let active = true;
    // Always start with a clean slate for the new room / retry
    cleanupSession();
    (async () => {
      try {
        const s = await acquire(roomId);
        if (!active) {
          release(roomId);
          return;
        }

        sessionRef.current = s;
        setSession(s);
        setModel(s.view.wellKnownModel("modelRoot") as ChatModel);
        setError(null);

        // Publish nickname once connected (optional)
        if (nickname) {
          s.view.publish("viewInfo", "setNickname", {
            viewId: s.view.viewId,
            nickname,
          });
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "unknown error");
        }
      }
    })();

    return () => {
      active = false;
      cleanupSession();
    };
  }, [roomId, nickname, retryKey, acquire, release, cleanupSession]);

  /* ────────────────────────────── Global/unmount cleanup */
  useEffect(() => {
    window.addEventListener("beforeunload", cleanupSession);
    return () => {
      window.removeEventListener("beforeunload", cleanupSession);
      cleanupSession();
    };
  }, [cleanupSession]);

  /* ────────────────────────────── Auto‑scroll when opened */
  useEffect(() => {
    if (isVisible && chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [isVisible]);

  /* ────────────────────────────── Render */
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
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
      </button>

      {/* Chat window */}
      <div
        ref={chatContainerRef}
        className={`fixed ${
          positionClasses[position]
        } z-40 w-[500px] h-[700px] bg-[#181828] rounded-lg shadow-2xl mb-20 mr-2 transition-all duration-300 ${
          isVisible
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
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
        ) : !session || !model || isConnecting || !session?.view?.viewId ? (
          <div className="p-4 h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a259ff] mx-auto mb-2"></div>
              <p className="text-gray-300">{getConnectionMessage()}</p>
              {connectionStatus === "reconnecting" && (
                <p className="text-gray-500 text-sm mt-1">Please wait...</p>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-hidden rounded-lg">
            <ChatViewComponent model={model} session={session} />
          </div>
        )}
      </div>
    </>
  );
}
