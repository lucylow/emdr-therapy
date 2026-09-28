export function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const secs = (safe % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const now = Date.now();
  const difference = now - date.getTime();

  if (difference < 24 * 60 * 60 * 1000) return "Today";
  if (difference < 48 * 60 * 60 * 1000) return "Yesterday";

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
