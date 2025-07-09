export const CHAT_COLORS = [
  // 보라/파랑 계열
  "#a259ff", "#7c3aed", "#38bdf8", "#818cf8", "#6366f1", "#4f46e5",
  // 분홍/빨강 계열
  "#f472b6", "#ec4899", "#f87171", "#ef4444", "#dc2626", "#e11d48",
  // 노랑/주황 계열
  "#facc15", "#fbbf24", "#f59e0b", "#fb923c", "#f97316", "#ea580c",
  // 초록 계열
  "#34d399", "#10b981", "#059669", "#22c55e", "#16a34a", "#15803d",
  // 청록/하늘 계열
  "#2dd4bf", "#06b6d4", "#0891b2", "#0ea5e9", "#3b82f6", "#2563eb"
] as const;

export const CHAT_STYLES = {
  container: "h-full flex flex-col",
  chatBox: "h-full flex flex-col bg-[#181828]"
} as const;

export const CHAT_LIMITS = {
  NICKNAME_DISPLAY_LENGTH: 6,
  MESSAGE_HISTORY_MAX: 100,
  INACTIVITY_TIMEOUT: 20 * 60 * 1000 // 20 minutes
} as const; 