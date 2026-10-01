"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

export type StartState = "ready" | "resume" | "preparing";

const POLL_MS = 5000;

export function StartButton({ state, status }: { state: StartState; status: string }) {
  const router = useRouter();

  // While nothing is prepared yet, re-render the server page until it is.
  useEffect(() => {
    if (state !== "preparing") return;
    const id = window.setInterval(() => router.refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [state, router]);

  return (
    <div className="mx-auto w-full sm:max-w-xs">
      {state === "preparing" ? (
        <div
          aria-disabled
          aria-live="polite"
          className="mt-1 flex h-[51px] w-full cursor-default items-center justify-center gap-2.5 rounded-xl border-[1.5px] border-ink/10 bg-ink/6 text-[15px] font-medium text-ink/55"
        >
          <motion.span
            aria-hidden
            className="size-1.5 rounded-full bg-brand"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          Preparing your session
        </div>
      ) : (
        <Button href="/session" width="capped">
          {state === "resume" ? "Resume today's session" : "Start today's session"}
        </Button>
      )}
      <p className="mt-3 text-center text-[13px] text-ink/50">{status}</p>
    </div>
  );
}
