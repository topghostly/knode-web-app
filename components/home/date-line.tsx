"use client";

import { useSyncExternalStore } from "react";
import { formatDateLine } from "@/lib/format";

const subscribe = () => () => {};

/** Today's date in the viewer's own time zone; the server's guess is swapped after hydration. */
export function DateLine({ serverDate }: { serverDate: string }) {
  const text = useSyncExternalStore(subscribe, () => formatDateLine(new Date()), () => serverDate);
  return <p className="text-sm text-ink/55">{text}</p>;
}
