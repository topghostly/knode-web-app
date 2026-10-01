"use client";

import { useSyncExternalStore } from "react";

/** mm:ss, or h:mm:ss past an hour. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

const subscribeEverySecond = (notify: () => void) => {
  const id = window.setInterval(notify, 1000);
  return () => window.clearInterval(id);
};
const nowInSeconds = () => Math.floor(Date.now() / 1000);

/**
 * Current time in whole seconds, re-rendering once a second. The server
 * snapshot is 0 so the first client render matches the HTML; the real value
 * arrives right after hydration.
 */
export function useNowSeconds(): number {
  return useSyncExternalStore(subscribeEverySecond, nowInSeconds, () => 0);
}

/** Elapsed since `startedAt`, as quiet tabular text. */
export function SessionClock({ startedAt }: { startedAt: string }) {
  const now = useNowSeconds();
  const elapsed = now === 0 ? null : now - Math.floor(new Date(startedAt).getTime() / 1000);
  return (
    <span className="inline-block min-w-10 text-right text-sm tabular-nums text-ink/55" aria-label="Time in session">
      {elapsed === null ? "" : formatDuration(elapsed)}
    </span>
  );
}
