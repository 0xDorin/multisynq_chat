import EmojiPickerReact, { EmojiClickData, Theme } from "emoji-picker-react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function EmojiPicker({
  onEmojiSelect,
  isOpen,
  onClose,
}: EmojiPickerProps) {
  if (!isOpen) return null;

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    onClose();
  };

  return (
    <div className="absolute bottom-full mb-2">
      <div className="relative">
        <EmojiPickerReact
          onEmojiClick={handleEmojiClick}
          theme={Theme.DARK}
          autoFocusSearch={false}
          lazyLoadEmojis={true}
        />
      </div>
    </div>
  );
}
