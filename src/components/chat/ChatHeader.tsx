interface ChatHeaderProps {
  title?: string;
}

export function ChatHeader({ title = "Multisynq Chat" }: ChatHeaderProps) {
  return (
    <h1 className="text-3xl font-bold text-center mb-8 text-white tracking-tight">
      {title}
    </h1>
  );
} 