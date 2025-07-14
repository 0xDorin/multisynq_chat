import { useState, useRef, useEffect, useCallback, memo } from "react";
import { EmojiPicker } from "./EmojiPicker";

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput = memo(function ChatInput({
  value,
  onChange,
  onKeyPress,
  onSend,
  placeholder = "Type a message...",
  disabled = false,
}: ChatInputProps) {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      if (disabled) return;

      const textarea = inputRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? 0;
      const newValue = value.slice(0, start) + emoji + value.slice(end);
      onChange({
        target: { value: newValue },
      } as React.ChangeEvent<HTMLInputElement>);

      // Adjust cursor position after emoji insertion
      const newCursorPos = start + emoji.length;
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [value, onChange, disabled]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      onKeyPress(e);
    },
    [onKeyPress, disabled]
  );

  const toggleEmojiPicker = useCallback(() => {
    if (disabled) return;
    setIsEmojiPickerOpen((prev) => !prev);
  }, [disabled]);

  const closeEmojiPicker = useCallback(() => {
    setIsEmojiPickerOpen(false);
  }, []);

  // Close emoji picker on outside click - optimized with useCallback
  useEffect(() => {
    if (!isEmojiPickerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target && !target.closest(".emoji-picker-container")) {
        setIsEmojiPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEmojiPickerOpen]);

  return (
    <div
      className="flex-shrink-0 p-4 border-t border-[#28284a] flex gap-2"
      style={{ backgroundColor: "#181828" }}
    >
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          placeholder={disabled ? "Login to chat..." : placeholder}
          className={`flex-1 px-4 py-3 pr-12 bg-[#23233a] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#a259ff] w-full ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          value={value}
          onChange={onChange}
          onKeyPress={handleKeyPress}
          autoComplete="off"
          disabled={disabled}
        />

        {/* Emoji button */}
        <button
          onClick={toggleEmojiPicker}
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xl transition-colors ${
            disabled
              ? "text-gray-500 cursor-not-allowed"
              : "text-gray-400 hover:text-gray-200"
          }`}
          type="button"
          aria-label="Open emoji picker"
          disabled={disabled}
        >
          😊
        </button>

        {/* Emoji picker */}
        <div className="emoji-picker-container relative">
          <EmojiPicker
            isOpen={isEmojiPickerOpen}
            onEmojiSelect={handleEmojiSelect}
            onClose={closeEmojiPicker}
          />
        </div>
      </div>
    </div>
  );
});
