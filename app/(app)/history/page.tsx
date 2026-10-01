import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition } from "react";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { sessionQuestions, sessions, technologies } from "@/db/schema";
import { getSession } from "@/lib/session";
import { Screen } from "@/components/ui/screen";
import { TechIcon } from "@/components/ui/tech-icon";

export const metadata: Metadata = { title: "History – Knode" };

const LIMIT = 30;
const STRONG = 70;

// History sits outside the MVP loop: a reverse-chronological list of finished
// sessions, each a way back into its own results. No charts, no trends.
export default async function HistoryPage() {
  const auth = await getSession();
  if (!auth) redirect("/sign-in");

  const completed = await db.query.sessions.findMany({
    columns: { id: true, score: true, completedAt: true },
    where: and(eq(sessions.userId, auth.user.id), eq(sessions.status, "COMPLETED")),
    orderBy: desc(sessions.completedAt),
    limit: LIMIT,
  });

  // One extra query for every listed session's technologies, rather than one per row.
  const ids = completed.map((s) => s.id);
  const rows = ids.length
    ? await db
        .selectDistinct({ sessionId: sessionQuestions.sessionId, name: technologies.name, slug: technologies.slug })
        .from(sessionQuestions)
        .innerJoin(technologies, eq(sessionQuestions.technologyId, technologies.id))
        .where(inArray(sessionQuestions.sessionId, ids))
        .orderBy(asc(technologies.name))
    : [];
  const techBySession = new Map<string, { name: string; slug: string }[]>();
  for (const r of rows) techBySession.set(r.sessionId, [...(techBySession.get(r.sessionId) ?? []), { name: r.name, slug: r.slug }]);

  const months = groupByMonth(
    completed.map((s) => ({
      id: s.id,
      completedAt: s.completedAt,
      score: s.score === null ? null : Math.round(Number(s.score)),
      technologies: techBySession.get(s.id) ?? [],
    })),
  );

  return (
    <ViewTransition default="auth-fade">
      <Screen>
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col pt-8">
          <h1 className="font-display text-[2rem] font-medium leading-[1.08] tracking-tight">History</h1>

          {completed.length === 0 ? (
            <div className="flex flex-1 flex-col justify-center">
              <p className="max-w-[40ch] text-[15px] leading-relaxed text-ink/70">
                Nothing here yet. Finish today&rsquo;s session and it will show up here, with its score and a way back into the
                feedback.
              </p>
              <Link
                href="/session"
                className="mt-6 w-fit rounded text-[15px] font-medium text-brand underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                Start a session
              </Link>
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-8">
              {months.map(({ label, entries }) => (
                <section key={label}>
                  <h2 className="mb-2.5 text-[13px] font-medium text-ink/55">{label}</h2>
                  <ol className="flex flex-col gap-2">
                    {entries.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/session/${s.id}/results`}
                          className="group flex items-center gap-4 rounded-2xl border border-ink/10 bg-surface px-4 py-3.5 outline-none transition-colors duration-150 hover:border-ink/25 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] text-ink">{s.completedAt ? dayFormat.format(s.completedAt) : "Date unknown"}</p>
                            <ul className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              {s.technologies.map((t) => (
                                <li key={t.slug} className="flex items-center gap-1.5 text-[13px] text-ink/55">
                                  <TechIcon slug={t.slug} className="size-3.5" />
                                  {t.name}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex w-20 shrink-0 flex-col items-end gap-1.5">
                            <span className="font-display text-[15px] font-medium tabular-nums">
                              {s.score === null ? "—" : `${s.score}%`}
                            </span>
                            <span aria-hidden className="h-1 w-full overflow-hidden rounded-full bg-ink/10">
                              <span
                                className={`block h-full rounded-full ${s.score !== null && s.score >= STRONG ? "bg-brand" : "bg-accent"}`}
                                style={{ width: `${s.score ?? 0}%` }}
                              />
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          )}
        </main>
      </Screen>
    </ViewTransition>
  );
}

const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });
const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

type Entry = { id: string; completedAt: Date | null; score: number | null; technologies: { name: string; slug: string }[] };

/** Consecutive runs of the same month, keeping the query's ordering. */
function groupByMonth(entries: Entry[]): { label: string; entries: Entry[] }[] {
  const groups: { label: string; entries: Entry[] }[] = [];
  for (const e of entries) {
    const label = e.completedAt ? monthFormat.format(e.completedAt) : "Earlier";
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.entries.push(e);
    else groups.push({ label, entries: [e] });
  }
  return groups;
}
