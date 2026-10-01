"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE } from "./deck-shell";
import { TechIcon } from "@/components/ui/tech-icon";

export type IndexEntry = {
  position: number;
  excerpt: string;
  answered: boolean;
  /** Technology slug, for the mark on the right. */
  technology?: string;
  trailing?: string;
};

/** Shared pill styling so the results "Overview" row matches the entries. */
export function pillClass(active: boolean) {
  return [
    "relative flex w-full items-center gap-3 rounded-full border py-2 pr-2 pl-4 text-left text-[13px] leading-snug outline-none",
    "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
    active ? "border-accent text-cream" : "border-ink/10 bg-surface hover:border-ink/20",
  ].join(" ");
}

/**
 * The margin index: one pill per question. The current one is filled with
 * the accent (a single pill slides between entries); answered ones read in
 * full ink, the rest recede. Each carries its technology mark on the right.
 */
export function QuestionIndex({
  entries,
  current,
  onSelect,
  layoutId = "question-index-pill",
  stagger = false,
}: {
  entries: IndexEntry[];
  current: number;
  onSelect: (position: number) => void;
  layoutId?: string;
  /** Rise the entries in one after another on mount (the mobile drawer). */
  stagger?: boolean;
}) {
  const reduced = useReducedMotion();
  const list = stagger && !reduced ? { hidden: {}, show: { transition: { staggerChildren: 0.035, delayChildren: 0.12 } } } : undefined;
  const item = stagger && !reduced ? { hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } } } : undefined;
  return (
    <motion.ol aria-label="Questions" className="flex flex-col gap-2" variants={list} initial={list ? "hidden" : false} animate={list ? "show" : undefined}>
      {entries.map((e) => {
        const active = e.position === current;
        return (
          <motion.li key={e.position} variants={item}>
            <button type="button" onClick={() => onSelect(e.position)} aria-current={active ? "step" : undefined} className={pillClass(active)}>
              {active && (
                <motion.span
                  layoutId={layoutId}
                  aria-hidden
                  transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 42 }}
                  className="absolute inset-0 rounded-full bg-accent"
                />
              )}
              <span className={`relative w-4 shrink-0 font-display tabular-nums ${active ? "text-cream" : e.answered ? "text-ink" : "text-ink/45"}`}>
                {e.position}
              </span>
              <span className={`relative min-w-0 flex-1 line-clamp-2 ${active ? "text-cream" : e.answered ? "text-ink/85" : "text-ink/50"}`}>
                {e.excerpt}
              </span>
              {e.trailing && (
                <span className={`relative shrink-0 tabular-nums ${active ? "text-cream/80" : "text-ink/55"}`}>{e.trailing}</span>
              )}
              {e.technology && (
                <span
                  className={`relative flex size-8 shrink-0 items-center justify-center rounded-full ${
                    active ? "bg-cream/20 text-cream" : "bg-ink/6 text-ink/70"
                  }`}
                >
                  <TechIcon slug={e.technology} className="size-4" />
                </span>
              )}
            </button>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}
