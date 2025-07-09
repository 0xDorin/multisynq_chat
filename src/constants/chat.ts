export const CHAT_COLORS = [
  "#a259ff", "#7c3aed", "#38bdf8", "#f472b6", 
  "#facc15", "#34d399", "#f87171", "#fbbf24"
] as const;

export const CHAT_STYLES = {
  container: "min-h-screen bg-[#181828] flex items-center justify-center",
  chatBox: "w-full max-w-2xl bg-[#23233a] rounded-2xl shadow-xl p-8",
  userInfo: "flex justify-between items-center mb-4 p-3 bg-[#23233a] rounded-xl border border-[#28284a]",
  messagesContainer: "h-80 md:h-96 overflow-y-auto p-4 bg-[#181828] rounded-xl border border-[#28284a] mb-4 text-sm text-gray-100",
  inputContainer: "flex gap-2 mt-2",
  input: "flex-1 px-4 py-3 bg-[#23233a] border border-[#28284a] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#a259ff]",
  button: "px-6 py-3 bg-[#a259ff] text-white rounded-xl font-semibold hover:bg-[#b084fa] focus:outline-none focus:ring-2 focus:ring-[#a259ff] transition",
  instructions: "mt-6 p-4 bg-[#23233a] rounded-xl text-sm text-gray-400 border border-[#28284a]"
} as const;

export const CHAT_COMMANDS = {
  RESET: '/reset'
} as const;

export const CHAT_LIMITS = {
  NICKNAME_DISPLAY_LENGTH: 6,
  MESSAGE_HISTORY_MAX: 100,
  INACTIVITY_TIMEOUT: 20 * 60 * 1000 // 20 minutes
} as const; 