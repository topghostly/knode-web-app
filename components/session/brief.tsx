"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { startSession } from "@/app/session/actions";
import { answeredIds, loadDraft } from "@/lib/session-drafts";
import { answerTypeMix, leadParagraph, technologyCounts, topicsLine } from "@/lib/session-brief";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Intro } from "@/components/ui/intro";
import { Screen } from "@/components/ui/screen";

export type BriefQuestion = {
  id: string;
  technology: string;
  answerType: "TEXT" | "CODE" | "MULTIPLE_CHOICE";
};

// One tint per technology, most frequent first: steps of the brand blue so
// the strip stays tonal however many technologies a session mixes. Beyond the
// scale, slots fall back to the surface colour.
const TINTS = [
  { fill: "bg-brand", mark: "text-cream" },
  { fill: "bg-brand/55", mark: "text-cream" },
  { fill: "bg-brand/30", mark: "text-ink" },
  { fill: "bg-brand/15", mark: "text-ink" },
  { fill: "bg-brand/7", mark: "text-ink" },
];
const TINT_FALLBACK = { fill: "bg-surface", mark: "text-ink" };

const subscribe = () => () => {};

/**
 * The pre-session brief: what this session is, in prose, and the run of
 * questions as a ten-slot strip tinted by technology. On resume the strip
 * doubles as progress — answered slots carry a mark — so there is no second
 * progress widget. Draft state lives in the browser, so it's unknown on the
 * server render; the snapshot is a joined string so the store sees a stable
 * value.
 */
export function Brief({
  sessionId,
  resuming,
  questions,
  topics,
}: {
  sessionId: string;
  resuming: boolean;
  questions: BriefQuestion[];
  topics: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const questionIds = questions.map((q) => q.id);
  const answeredKey = useSyncExternalStore(
    subscribe,
    () => answeredIds(loadDraft(sessionId), questionIds).join("\n"),
    () => "",
  );
  const answered = new Set(answeredKey ? answeredKey.split("\n") : []);

  function begin() {
    setError(null);
    start(async () => {
      const result = await startSession();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push(`/session/${result.sessionId}`);
    });
  }

  const technologies = questions.map((q) => q.technology);
  const counts = technologyCounts(technologies);
  const tintOf = new Map(counts.map(({ name }, i) => [name, TINTS[i] ?? TINT_FALLBACK]));
  const hasCode = questions.some((q) => q.answerType === "CODE");
  const lead = leadParagraph({ total: questions.length, technologies, hasCode, resuming, answered: answered.size });
  const topicsCopy = topicsLine(topics);

  return (
    <Screen withNav={false}>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
        <header className="flex h-10 shrink-0 items-center">
          <BackLink href="/">Home</BackLink>
        </header>

        <Intro className="flex flex-1 flex-col justify-center py-8 sm:py-12">
          <h1 className="font-display text-[2rem] font-medium leading-[1.08] tracking-tight text-balance sm:text-[2.5rem]">
            {resuming ? "Pick up where you left off." : "Today's session."}
          </h1>

          <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-ink/75 sm:text-[16px]">{lead}</p>

          <section className="mt-8" aria-label="Questions in order">
            <ol className="flex gap-1.5">
              {questions.map((q, i) => {
                const tint = tintOf.get(q.technology) ?? TINT_FALLBACK;
                const done = answered.has(q.id);
                return (
                  <li
                    key={q.id}
                    className={`relative h-9 flex-1 rounded-md border-[1.5px] border-ink/15 sm:h-10 ${tint.fill}`}
                    title={`${i + 1}. ${q.technology}${done ? " — answered" : ""}`}
                  >
                    {done && (
                      <svg
                        aria-hidden
                        viewBox="0 0 16 16"
                        className={`absolute inset-0 m-auto size-4 ${tint.mark}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3.5 8.5 6.5 11.5 12.5 5" />
                      </svg>
                    )}
                    <span className="sr-only">
                      Question {i + 1}, {q.technology}
                      {done ? ", answered" : ""}
                    </span>
                  </li>
                );
              })}
            </ol>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-ink/70">
              {counts.map(({ name, count }) => (
                <li key={name} className="flex items-center gap-1.5">
                  <span aria-hidden className={`size-2.5 rounded-[3px] border border-ink/15 ${(tintOf.get(name) ?? TINT_FALLBACK).fill}`} />
                  {count} {name}
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-ink/75">
            {answerTypeMix(questions.map((q) => q.answerType))}
            {topicsCopy && <> {topicsCopy}</>}
          </p>

          <div className="mt-10">
            <Button onClick={begin} disabled={pending} width="capped">
              {pending ? (resuming ? "Opening…" : "Starting…") : resuming ? "Resume session" : "Begin session"}
            </Button>
            <p className="mt-3 min-h-5 text-[13px] text-ink/50 sm:max-w-xs" aria-live="polite">
              {error ?? (resuming ? "Your timer continues from where it was." : "The timer starts when you begin.")}
            </p>
          </div>
        </Intro>
      </div>
    </Screen>
  );
}
