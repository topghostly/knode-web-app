"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import type { RubricResultItem } from "@/db/schema";
import { clearDraft } from "@/lib/session-drafts";
import { countInWords } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { DeckShell, EASE, IndexDrawer, IndexHandle, pageVariants } from "@/components/session/deck-shell";
import { QuestionIndex, pillClass, type IndexEntry } from "@/components/session/question-index";
import { ChoiceReview } from "./choice-review";

export type ReviewQuestion = {
  id: string;
  position: number;
  technology: string;
  technologySlug: string;
  topic: string;
  excerpt: string;
  answerType: "TEXT" | "CODE" | "MULTIPLE_CHOICE";
  options: string[] | null;
  correctOption: string | null;
  userAnswer: string;
  score: number;
  rubricResult: RubricResultItem[];
  feedback: string;
  missingPoints: string[];
  questionBody: ReactNode;
  answerBody: ReactNode | null;
  betterAnswerBody: ReactNode | null;
};

const STRONG = 7;

export function ResultsDeck({
  sessionId,
  score,
  questions,
  initialPosition = 0,
}: {
  sessionId: string;
  score: number;
  questions: ReviewQuestion[];
  /** 0 is the cover. Exposed for previews and tests. */
  initialPosition?: number;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const total = questions.length;

  // 0 is the cover; 1..total are questions.
  const [position, setPosition] = useState(initialPosition);
  const [dir, setDir] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  // The session is graded; its local drafts have done their job.
  useEffect(() => clearDraft(sessionId), [sessionId]);

  const go = useCallback(
    (to: number) => {
      if (to < 0 || to > total || to === position) return;
      setDir(to > position ? 1 : -1);
      setPosition(to);
      setSheetOpen(false);
    },
    [position, total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(position + 1);
      if (e.key === "ArrowLeft") go(position - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, position]);

  const entries: IndexEntry[] = useMemo(
    () =>
      questions.map((q) => ({
        position: q.position,
        excerpt: q.excerpt,
        technology: q.technologySlug,
        answered: q.score >= STRONG,
        trailing: `${q.score}/10`,
      })),
    [questions],
  );
  const strong = questions.filter((q) => q.score >= STRONG).length;
  const current = position === 0 ? null : questions[position - 1];
  const isLast = position === total;

  const pageProps = {
    custom: dir,
    variants: pageVariants,
    initial: reduced ? { opacity: 0 } : "enter",
    animate: reduced ? { opacity: 1 } : "center",
    exit: reduced ? { opacity: 0 } : "exit",
    transition: { duration: reduced ? 0.15 : 0.36, ease: EASE },
  } as const;

  return (
    <DeckShell
      back={{ href: "/", label: "Home" }}
      right={<span className="text-sm tabular-nums text-ink/55">{score}%</span>}
    >
      <LayoutGroup id="results">
        <div className="flex flex-1 gap-10 pt-6 md:pt-8">
          <aside className="hidden w-72 shrink-0 md:block">
            <div className="sticky top-6 flex flex-col gap-2">
              <button type="button" onClick={() => go(0)} aria-current={position === 0 ? "step" : undefined} className={pillClass(position === 0)}>
                {position === 0 && (
                  <motion.span
                    layoutId="question-index-pill"
                    aria-hidden
                    transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 42 }}
                    className="absolute inset-0 rounded-full bg-accent"
                  />
                )}
                <span className={`relative flex-1 py-1 ${position === 0 ? "text-cream" : "text-ink/70"}`}>Overview</span>
                <span className={`relative pr-2 tabular-nums ${position === 0 ? "text-cream/80" : "text-ink/55"}`}>{score}%</span>
              </button>
              <QuestionIndex entries={entries} current={position} onSelect={go} />
            </div>
          </aside>

          <div className="relative min-w-0 flex-1 overflow-hidden">
            <AnimatePresence mode="popLayout" custom={dir} initial={false}>
              {current === null ? (
                <motion.section key="cover" {...pageProps} className="flex min-h-full flex-col justify-center py-6">
                  <p className="text-sm text-ink/55">Session complete</p>
                  <h1 className="mt-3 font-display text-[4rem] leading-none font-medium tracking-tight tabular-nums sm:text-[5rem]">{score}%</h1>
                  <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-ink/70">
                    {strong === total
                      ? `All ${countInWords(total)} answers scored ${STRONG} or higher.`
                      : `${capitalize(countInWords(strong))} of ${countInWords(total)} answers scored ${STRONG} or higher.`}
                  </p>
                  <div className="mt-10">
                    <Button onClick={() => go(1)}>Review the answers</Button>
                  </div>
                </motion.section>
              ) : (
                <motion.section key={current.id} {...pageProps} aria-labelledby={`r-${current.id}`} className="flex min-h-full flex-col">
                  <header className="flex items-start justify-between gap-4">
                    <p id={`r-${current.id}`} className="text-[15px]">
                      <span className="text-ink">{current.technology}</span>
                      <span className="ml-2 text-ink/45">{current.topic}</span>
                    </p>
                    <p className="font-display text-2xl leading-none tabular-nums">
                      {current.score}
                      <span className="text-ink/35">/10</span>
                    </p>
                  </header>

                  <div className="mt-5 text-ink/75 [&_.question-body]:text-[15px]">{current.questionBody}</div>

                  <Section title="Your answer">
                    {current.answerType === "MULTIPLE_CHOICE" ? (
                      <ChoiceReview options={current.options ?? []} picked={current.userAnswer} correct={current.correctOption} />
                    ) : current.answerBody ? (
                      current.answerBody
                    ) : current.userAnswer.trim() ? (
                      <p className="rounded-xl bg-surface px-4 py-3.5 text-[15px] leading-relaxed whitespace-pre-wrap">{current.userAnswer}</p>
                    ) : (
                      <p className="text-[15px] text-ink/50">Left blank.</p>
                    )}
                  </Section>

                  <Section title="Feedback">
                    <p className="text-[17px] leading-relaxed text-ink">{current.feedback}</p>
                    {current.missingPoints.length > 0 && (
                      <ul className="mt-4 space-y-1.5 text-[15px] leading-relaxed text-ink/75">
                        {current.missingPoints.map((m) => (
                          <li key={m} className="flex gap-3">
                            <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-accent" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>

                  <Section title="Rubric">
                    <dl className="divide-y divide-ink/10 border-y border-ink/10 text-[14px]">
                      {current.rubricResult.map((r) => (
                        <div key={r.criterion} className="flex items-baseline justify-between gap-6 py-2.5">
                          <dt className={r.awardedPoints === r.maxPoints ? "text-ink" : r.awardedPoints === 0 ? "text-ink/45" : "text-ink/75"}>
                            {r.criterion}
                          </dt>
                          <dd className="shrink-0 tabular-nums text-ink/70">
                            {r.awardedPoints}
                            <span className="text-ink/35">/{r.maxPoints}</span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </Section>

                  {current.betterAnswerBody && (
                    <Section title="A stronger answer">
                      <div className="[&_.question-body]:text-[15px]">{current.betterAnswerBody}</div>
                    </Section>
                  )}

                  <footer className="mt-10 flex items-center justify-between gap-4 pb-20 md:pb-2">
                    <Button variant="secondary" size="md" onClick={() => go(position - 1)}>
                      Back
                    </Button>
                    <Button size="md" onClick={() => (isLast ? router.push("/") : go(position + 1))}>
                      {isLast ? "Done" : "Next"}
                    </Button>
                  </footer>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>

        {current && <IndexHandle label={`${position} of ${total}`} open={sheetOpen} onOpen={() => setSheetOpen(true)} />}
        <IndexDrawer open={sheetOpen} onClose={closeSheet}>
          <QuestionIndex entries={entries} current={position} onSelect={go} layoutId="results-index-pill-drawer" stagger />
        </IndexDrawer>
      </LayoutGroup>
    </DeckShell>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-[13px] font-medium text-ink/50">{title}</h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
