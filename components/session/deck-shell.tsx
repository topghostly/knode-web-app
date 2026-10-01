"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BackLink } from "@/components/ui/back-link";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Page-turn: slide 40px in the travel direction and fade. */
export const pageVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -40 }),
};

/** Top rail + contained, internally scrolling column shared by the session and results decks. */
export function DeckShell({
  back,
  right,
  children,
}: {
  back: { href: string; label: string };
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8">
      <div className="mx-auto flex w-full max-w-[75rem] flex-1 flex-col overflow-hidden">
        <header className="flex h-10 shrink-0 items-center justify-between">
          <BackLink href={back.href}>{back.label}</BackLink>
          {right ?? <span />}
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/**
 * The mobile index control: floats over the bottom-left of the deck rather
 * than sitting in the rail, so it stays in reach wherever the column is
 * scrolled. Hidden while the drawer is open so it doesn't sit on the panel.
 */
export function IndexHandle({ label, open, onOpen }: { label: string; open: boolean; onOpen: () => void }) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>
      {!open && (
        <motion.button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`Questions, ${label}`}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.22, ease: EASE }}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-30 flex h-12 items-center gap-2.5 rounded-full border border-ink/10 bg-surface pr-5 pl-4 text-sm text-ink tabular-nums shadow-[0_6px_20px_-6px_rgba(56,56,56,0.3)] transition-colors duration-150 active:bg-ink/5 md:hidden"
        >
          <svg aria-hidden viewBox="0 0 16 16" className="size-4 text-ink/70" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
          </svg>
          {label}
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/**
 * The mobile index drawer: slides in from the left over a dimmed page, the
 * page's own eased curve for the panel and a staggered rise for whatever is
 * inside (the index animates its entries when `stagger` is set). Escape and
 * the backdrop close it; body scroll is held while it's open.
 */
export function IndexDrawer({ open, onClose, title = "Questions", children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-ink/25 md:hidden"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduced ? { opacity: 0 } : { x: "-100%" }}
            animate={reduced ? { opacity: 1 } : { x: 0 }}
            exit={reduced ? { opacity: 0 } : { x: "-100%" }}
            transition={reduced ? { duration: 0.15 } : { duration: 0.42, ease: EASE }}
            className="fixed inset-y-0 left-0 z-50 flex w-[76vw] max-w-[19rem] flex-col bg-cream shadow-[8px_0_32px_-12px_rgba(56,56,56,0.3)] md:hidden"
          >
            <header className="flex h-10 shrink-0 items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-2 box-content">
              <span className="font-display text-[15px] font-medium">{title}</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-2 flex size-9 items-center justify-center rounded-full text-ink/60 transition-colors duration-150 hover:bg-ink/5 hover:text-ink"
              >
                <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="m4 4 8 8M12 4l-8 8" />
                </svg>
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
