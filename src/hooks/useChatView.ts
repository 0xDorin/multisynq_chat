import { useState, useEffect, useCallback } from "react";
import { View } from "@multisynq/client";
import { ChatView } from "@/components/ChatView";
import { ChatModel } from "@/lib/ChatModel";
import { ChatMessage } from "@/types/chat";
import { CHAT_LIMITS } from "@/constants/chat";

interface UseChatViewProps {
  model: View;
  session?: any;
}

export function useChatView({ model, session }: UseChatViewProps) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [nickname, setNickname] = useState<string>("");
  const [viewCount, setViewCount] = useState<number>(1);
  const [input, setInput] = useState("");
  const [chatView, setChatView] = useState<ChatView | null>(null);

  // ChatModel 가져오기 - 안전한 null 체크
  const chatModel =
    model?.wellKnownModel && typeof model.wellKnownModel === "function"
      ? (model.wellKnownModel("modelRoot") as ChatModel)
      : null;

  // ChatView 인스턴스 생성 및 콜백 연결
  useEffect(() => {
    if (!chatModel) return;

    const view = new ChatView(chatModel);

    view.setUpdateCallbacks(
      // 전체 히스토리 갱신 (리셋 시에만)
      (newHistory) => setHistory([...newHistory]),
      // 새 메시지 추가 (개별 메시지)
      (newMessage) => setHistory((prev) => [...prev, newMessage]),
      (newNickname, newViewCount) => {
        setNickname(newNickname);
        setViewCount(newViewCount);
      }
    );

    setChatView(view);

    return () => {
      view.cleanup();
    };
  }, [chatModel]);

  // 채팅 입력 핸들러
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
    },
    []
  );

  const handleSend = useCallback(() => {
    if (!input.trim() || !chatView) return;
    chatView.sendMessage(input);
    setInput("");
  }, [input, chatView]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSend();
    },
    [handleSend]
  );

  // 닉네임 처리 - null 체크 추가
  const realNickname =
    nickname ||
    (session?.view?.viewId && chatModel
      ? chatModel.getViews().get(session.view.viewId)
      : "") ||
    "Loading...";

  const displayNickname =
    realNickname.length > CHAT_LIMITS.NICKNAME_DISPLAY_LENGTH
      ? realNickname.slice(0, CHAT_LIMITS.NICKNAME_DISPLAY_LENGTH) + "..."
      : realNickname;

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
