"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { submitSession } from "@/app/session/actions";
import { answeredCount, loadDraft, saveDraft, type SessionDraft } from "@/lib/session-drafts";
import { countInWords } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { DeckShell, EASE, IndexDrawer, IndexHandle, pageVariants } from "./deck-shell";
import { QuestionIndex, type IndexEntry } from "./question-index";
import { ChoiceList } from "./choice-list";
import { TextAnswer } from "./text-answer";
import { SessionClock, formatDuration } from "./timers";

const CodeEditor = dynamic(() => import("./code-editor").then((m) => m.CodeEditor), {
  ssr: false,
  loading: () => <div className="h-48 rounded-xl bg-surface" aria-hidden />,
});

export type DeckQuestion = {
  id: string;
  position: number;
  answerType: "TEXT" | "CODE" | "MULTIPLE_CHOICE";
  options: string[] | null;
  codeLanguage: string | null;
  technology: string;
  technologySlug: string;
  topic: string;
  excerpt: string;
  body: ReactNode;
};

type DeckProps = { sessionId: string; startedAt: string; questions: DeckQuestion[] };

const subscribeNoop = () => () => {};

/**
 * Drafts live in the browser, so the deck body only renders on the client;
 * the server sends the rail and an empty column. That lets the draft seed
 * state directly instead of arriving in an effect.
 */
export function SessionDeck(props: DeckProps) {
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  if (!isClient) return <Shell startedAt={props.startedAt} />;
  return <Deck {...props} />;
}

function Deck({ sessionId, startedAt, questions }: DeckProps) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const total = questions.length;

  const [draft, setDraft] = useState<SessionDraft>(() => {
    const stored = loadDraft(sessionId);
    return { ...stored, position: Math.min(Math.max(stored.position, 1), total) };
  });
  const [dir, setDir] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const [phase, setPhase] = useState<"answering" | "grading" | "failed">("answering");
  const [failure, setFailure] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    saveDraft(sessionId, draft);
  }, [draft, sessionId]);

  const position = draft.position;
  const current = questions[position - 1];
  const answer = draft.answers[current.id] ?? "";

  // Per-question clock: one second per tick for the visible question, only while the tab is visible.
  const currentId = current.id;
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setDraft((d) => ({ ...d, seconds: { ...d.seconds, [currentId]: (d.seconds[currentId] ?? 0) + 1 } }));
    }, 1000);
    return () => window.clearInterval(id);
  }, [currentId]);

  const go = useCallback(
    (to: number) => {
      if (to < 1 || to > total || to === position) return;
      setDir(to > position ? 1 : -1);
      setDraft((d) => ({ ...d, position: to }));
      setSheetOpen(false);
    },
    [position, total],
  );

  const setAnswer = (value: string) => setDraft((d) => ({ ...d, answers: { ...d.answers, [current.id]: value } }));

  const entries: IndexEntry[] = useMemo(
    () =>
      questions.map((q) => ({
        position: q.position,
        excerpt: q.excerpt,
        technology: q.technologySlug,
        answered: (draft.answers[q.id] ?? "").trim().length > 0,
      })),
    [questions, draft.answers],
  );
  const answered = answeredCount(draft, questions.map((q) => q.id));
  const unanswered = total - answered;
  const isLast = position === total;

  function finish() {
    setPhase("grading");
    setFailure(null);
    startTransition(async () => {
      const result = await submitSession({
        sessionId,
        answers: questions.map((q) => ({ questionId: q.id, answer: draft.answers[q.id] ?? "" })),
      });
      if (!result.ok) {
        setFailure(result.message);
        setPhase("failed");
        return;
      }
      router.push(`/session/${sessionId}/results`);
    });
  }

  // ⌘/Ctrl+Enter advances; plain arrows are left alone so typing isn't hijacked.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (isLast) finish();
        else go(position + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (phase !== "answering") {
    return (
      <Shell startedAt={startedAt}>
        <main className="flex flex-1 flex-col justify-center">
          {phase === "grading" ? (
            <>
              <h1 className="font-display text-[2rem] font-medium leading-[1.08] tracking-tight text-balance">Grading your answers.</h1>
              <p className="mt-4 flex items-center gap-2.5 text-[15px] text-ink/70">
                <motion.span
                  aria-hidden
                  className="size-1.5 rounded-full bg-brand"
                  animate={reduced ? undefined : { opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
                Usually under half a minute.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-[2rem] font-medium leading-[1.08] tracking-tight text-balance">Grading didn&rsquo;t go through.</h1>
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ink/70">{failure}</p>
              <Button onClick={finish} className="mt-8">
                Try again
              </Button>
            </>
          )}
        </main>
      </Shell>
    );
  }

  return (
    <Shell startedAt={startedAt}>
      <LayoutGroup id="deck">
        <div className="flex flex-1 gap-10 pt-6 md:pt-8">
          <aside className="hidden w-72 shrink-0 md:block">
            <div className="sticky top-6">
              <QuestionIndex entries={entries} current={position} onSelect={go} />
            </div>
          </aside>

          <div className="relative min-w-0 flex-1 overflow-hidden">
            <AnimatePresence mode="popLayout" custom={dir} initial={false}>
              <motion.section
                key={current.id}
                custom={dir}
                variants={pageVariants}
                initial={reduced ? { opacity: 0 } : "enter"}
                animate={reduced ? { opacity: 1 } : "center"}
                exit={reduced ? { opacity: 0 } : "exit"}
                transition={{ duration: reduced ? 0.15 : 0.36, ease: EASE }}
                aria-labelledby={`q-${current.id}-heading`}
                className="flex min-h-full flex-col"
              >
                <header>
                  <p id={`q-${current.id}-heading`} className="text-[15px]">
                    <span className="text-ink">{current.technology}</span>
                    <span className="ml-2 text-ink/45">{current.topic}</span>
                  </p>
                  <p className="mt-1 text-[13px] tabular-nums text-ink/45">{formatDuration(draft.seconds[current.id] ?? 0)} on this one</p>
                </header>

                <div className="mt-6">{current.body}</div>

                <div className="mt-8">
                  <label htmlFor={`answer-${current.id}`} className="sr-only">
                    Your answer
                  </label>
                  {current.answerType === "TEXT" && <TextAnswer id={`answer-${current.id}`} value={answer} onChange={setAnswer} />}
                  {current.answerType === "CODE" && <CodeEditor value={answer} onChange={setAnswer} language={current.codeLanguage} />}
                  {current.answerType === "MULTIPLE_CHOICE" && (
                    <ChoiceList name={`answer-${current.id}`} options={current.options ?? []} value={answer} onChange={setAnswer} />
                  )}
                </div>

                <footer className="mt-8 flex items-center justify-between gap-4 pb-20 md:pb-2">
                  <Button variant="secondary" size="md" onClick={() => go(position - 1)} className={position === 1 ? "invisible" : ""}>
                    Back
                  </Button>
                  <div className="flex items-center gap-4">
                    {isLast && unanswered > 0 && (
                      <span className="text-[13px] text-ink/50">
                        {capitalize(countInWords(unanswered))} unanswered
                      </span>
                    )}
                    <Button size="md" onClick={() => (isLast ? finish() : go(position + 1))}>
                      {isLast ? "Finish session" : "Next question"}
                    </Button>
                  </div>
                </footer>
              </motion.section>
            </AnimatePresence>
          </div>
        </div>

        <IndexHandle label={`${position} of ${total}`} open={sheetOpen} onOpen={() => setSheetOpen(true)} />
        <IndexDrawer open={sheetOpen} onClose={closeSheet}>
          <QuestionIndex entries={entries} current={position} onSelect={go} layoutId="question-index-pill-drawer" stagger />
        </IndexDrawer>
      </LayoutGroup>
    </Shell>
  );
}

function Shell({ startedAt, children }: { startedAt: string; children?: ReactNode }) {
  return (
    <DeckShell back={{ href: "/", label: "Leave" }} right={<SessionClock startedAt={startedAt} />}>
      {children}
    </DeckShell>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
