"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ExperienceLevel } from "@/db/schema";
import { completeOnboarding } from "@/app/onboarding/actions";
import { CATEGORY_ORDER, EXPERIENCE_LEVELS, MAX_TECHNOLOGIES, MIN_TECHNOLOGIES } from "@/lib/onboarding";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Technology = { id: string; name: string; category: string };

const STEPS = 2;

const slide = {
  initial: (dir: number) => ({ opacity: 0, x: dir * 28 }),
  animate: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -28 }),
};
const ease = [0.22, 1, 0.36, 1] as const;

export function OnboardingFlow({
  firstName,
  technologies,
  initialSelected,
  initialLevel,
}: {
  firstName: string;
  technologies: Technology[];
  initialSelected: string[];
  initialLevel: ExperienceLevel | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelected));
  const [level, setLevel] = useState<ExperienceLevel | null>(initialLevel);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: technologies.filter((t) => t.category === category),
  })).filter((g) => g.items.length > 0);

  const atMax = selected.size >= MAX_TECHNOLOGIES;
  const canContinue = step === 0 ? selected.size >= MIN_TECHNOLOGIES : level !== null;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX_TECHNOLOGIES) next.add(id);
      return next;
    });
  }

  function go(to: number) {
    setDir(to > step ? 1 : -1);
    setStep(to);
    setError(null);
  }

  function finish() {
    if (!level) return;
    startTransition(async () => {
      const result = await completeOnboarding({ technologyIds: [...selected], experienceLevel: level });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setDone(true);
      router.prefetch("/");
      window.setTimeout(() => router.push("/"), 1400);
    });
  }

  if (done) return <Done firstName={firstName} />;

  return (
    <div className="flex h-dvh flex-col">
      <header className="mx-auto w-full max-w-2xl px-6 pt-8 sm:pt-12">
        <div className="flex items-center justify-between text-sm text-ink/50">
          <span>{firstName ? `Hi ${firstName}` : "Set up"}</span>
          <span className="tabular-nums">
            {step + 1} of {STEPS}
          </span>
        </div>
        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {Array.from({ length: STEPS }, (_, i) => (
            <span
              key={i}
              className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-ink" : "bg-ink/15"}`}
            />
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto mask-[linear-gradient(to_bottom,transparent,black_28px,black_calc(100%-28px),transparent)]">
        <div className="mx-auto w-full max-w-2xl px-6 py-8 sm:py-10">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            {step === 0 ? (
              <motion.section
                key="tech"
                custom={dir}
                variants={slide}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.24, ease }}
              >
                <h1 className="font-display text-3xl font-medium leading-[1.08] tracking-tight sm:text-4xl">
                  What do you work with?
                </h1>
                <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
                  Pick up to {MAX_TECHNOLOGIES}. Your daily sessions draw from these.
                </p>

                <div className="mt-9 space-y-7">
                  {groups.map((group) => (
                    <div key={group.category}>
                      <p className="mb-3 text-sm text-ink/50">{group.category}</p>
                      <div className="flex flex-wrap gap-2" role="group" aria-label={group.category}>
                        {group.items.map((tech) => {
                          const on = selected.has(tech.id);
                          const blocked = !on && atMax;
                          return (
                            <motion.button
                              key={tech.id}
                              type="button"
                              aria-pressed={on}
                              disabled={blocked}
                              onClick={() => toggle(tech.id)}
                              whileTap={{ scale: 0.96 }}
                              className={`h-10 rounded-full border px-4 text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                                on
                                  ? "border-brand bg-brand text-cream"
                                  : "border-ink/15 bg-surface text-ink hover:border-ink/40 disabled:opacity-40 disabled:hover:border-ink/15"
                              }`}
                            >
                              {tech.name}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            ) : (
              <motion.section
                key="level"
                custom={dir}
                variants={slide}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.24, ease }}
              >
                <h1 className="font-display text-3xl font-medium leading-[1.08] tracking-tight sm:text-4xl">
                  How long have you been building software?
                </h1>
                <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
                  We pitch the depth of each question to this.
                </p>

                <div className="mt-9 divide-y divide-ink/10 border-y border-ink/10" role="radiogroup" aria-label="Experience level">
                  {EXPERIENCE_LEVELS.map((opt) => {
                    const on = level === opt.value;
                    return (
                      <div
                        key={opt.value}
                        role="radio"
                        aria-checked={on}
                        tabIndex={0}
                        onClick={() => setLevel(opt.value)}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") {
                            e.preventDefault();
                            setLevel(opt.value);
                          }
                        }}
                        className="flex cursor-pointer items-center gap-5 py-5 outline-none focus-visible:bg-surface/70"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline gap-2">
                            <span
                              className={`text-[15px] font-medium transition-colors ${on ? "text-ink" : "text-ink/80"}`}
                            >
                              {opt.title}
                            </span>
                            <span className="text-sm tabular-nums text-ink/45">{opt.years}</span>
                          </span>
                          <span className="mt-0.5 block text-sm text-ink/60">{opt.description}</span>
                        </span>
                        <Switch checked={on} tabIndex={-1} aria-hidden="true" />
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-2xl px-6 pb-8 sm:pb-12">
        {error && (
          <p role="alert" className="mb-3 text-sm text-accent">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between gap-4">
          {step === 0 ? (
            <span className="text-sm tabular-nums text-ink/50" aria-live="polite">
              {selected.size} of {MAX_TECHNOLOGIES} selected
            </span>
          ) : (
            <Button variant="secondary" size="md" onClick={() => go(0)}>
              Back
            </Button>
          )}
          <Button size="md" disabled={!canContinue || pending} onClick={() => (step === 0 ? go(1) : finish())} className="min-w-36">
            {step === 0 ? "Continue" : pending ? "Saving…" : "Start using Knode"}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function Done({ firstName }: { firstName: string }) {
  return (
    <motion.div
      className="flex h-dvh flex-col items-center justify-center px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      aria-live="polite"
    >
      <motion.svg
        viewBox="0 0 64 64"
        className="size-16"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        aria-hidden="true"
      >
        <circle cx="32" cy="32" r="31" className="fill-brand" />
        <motion.path
          d="M20 33 L28.5 41.5 L44 24"
          fill="none"
          className="stroke-cream"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.45, ease }}
        />
      </motion.svg>
      <motion.h1
        className="mt-8 font-display text-3xl font-medium leading-[1.08] tracking-tight sm:text-4xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7, ease }}
      >
        You&apos;re set{firstName ? `, ${firstName}` : ""}.
      </motion.h1>
    </motion.div>
  );
}
