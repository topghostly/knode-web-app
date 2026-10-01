"use client";

import { useLayoutEffect, useRef } from "react";

/** Auto-growing textarea on the surface colour; a hairline appears on focus. */
export function TextAnswer({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(el.scrollHeight, 160)}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Your answer"
      rows={5}
      spellCheck
      className="block w-full resize-none rounded-xl border border-transparent bg-surface px-4 py-3.5 text-[15px] leading-relaxed text-ink outline-none transition-colors duration-150 placeholder:text-ink/35 focus:border-ink/25"
    />
  );
}
