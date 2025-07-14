import { useState, useEffect, useCallback, useMemo } from "react";
import { View } from "@multisynq/client";
import { ChatModel } from "@/lib/ChatModel";
import { ChatMessage } from "@/types/chat";
import { CHAT_LIMITS } from "@/constants/chat";

/**
 * Hook that binds a Multisynq **View** to React state without spawning a second view.
 * @param view – the **existing** `session.view` you got from LiveChatToggle.
 */
interface UseChatViewProps {
  view: View;
}

export function useChatView({ view }: UseChatViewProps) {
  /* ---------------------------- derived instances --------------------------- */
  const chatModel: ChatModel | null = useMemo(() => {
    return view?.wellKnownModel
      ? (view.wellKnownModel("modelRoot") as ChatModel)
      : null;
  }, [view]);

  /* --------------------------------- state --------------------------------- */
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [nickname, setNickname] = useState<string>("");
  const [viewCount, setViewCount] = useState<number>(1);
  const [input, setInput] = useState<string>("");

  /* --------------------------- Multisynq subscriptions ---------------------- */
  useEffect(() => {
    if (!chatModel || !view) return; // guard – model not ready yet

    /* subscription handlers */
    const handleHistoryRefresh = () => setHistory([...chatModel.getHistory()]);
    const handleNewMessage = (msg: ChatMessage) =>
      setHistory((prev) => [...prev, msg]);
    const handleViewInfoRefresh = () => {
      setNickname(chatModel.getViews().get(view.viewId) || "");
      setViewCount(chatModel.getParticipants());
    };

    /* attach */
    view.subscribe("history", "refresh", handleHistoryRefresh);
    view.subscribe("history", "newMessage", handleNewMessage);
    view.subscribe("viewInfo", "refresh", handleViewInfoRefresh);

    /* initial sync */
    handleHistoryRefresh();
    handleViewInfoRefresh();

    /* detach */
    return () => {
      view.unsubscribe("history", "refresh", handleHistoryRefresh);
      view.unsubscribe("history", "newMessage", handleNewMessage);
      view.unsubscribe("viewInfo", "refresh", handleViewInfoRefresh);
      // NOTE: 실제 WebSocket detatch/leave 관리는 LiveChatToggle → release() 가 담당
    };
  }, [chatModel, view]);

  /* ------------------------------ ui helpers ------------------------------- */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value),
    []
  );

  const handleSend = useCallback(() => {
    if (!input.trim() || !view) return;
    view.publish("input", "newPost", { viewId: view.viewId, text: input });
    setInput("");
  }, [input, view]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSend();
    },
    [handleSend]
  );

  /* derived nickname */
  const displayNickname = useMemo(() => {
    const real = nickname || "Loading…";
    return real.length > CHAT_LIMITS.NICKNAME_DISPLAY_LENGTH
      ? `${real.slice(0, CHAT_LIMITS.NICKNAME_DISPLAY_LENGTH)}…`
      : real;
  }, [nickname]);

  /* ------------------------------- return ---------------------------------- */
  return {
    history,
    displayNickname,
    viewCount,
    input,
    handleInputChange,
    handleSend,
    handleKeyPress,
    model: chatModel,
  };
}
