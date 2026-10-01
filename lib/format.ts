/** "React", "React and Vue", "React, Vue and Svelte". */
export function listInProse(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/** Small counts read better as words in running copy. */
export function countInWords(n: number): string {
  return WORDS[n] ?? String(n);
}

/** Coarse relative time for copy like "Started 12 minutes ago". */
export function timeAgo(from: Date, now = new Date()): string {
  const mins = Math.max(0, Math.round((now.getTime() - from.getTime()) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} ${mins === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

/** "Tuesday 21 September" — the Home date line. */
export function formatDateLine(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(d);
}
