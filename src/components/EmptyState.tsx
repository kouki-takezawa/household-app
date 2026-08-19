export function EmptyState({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-track text-subtle">
        {icon}
      </span>
      <p className="text-[13px] text-muted">{message}</p>
    </div>
  );
}
