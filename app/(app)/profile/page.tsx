import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition } from "react";
import { redirect } from "next/navigation";
import { and, avg, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { EXPERIENCE_LEVELS } from "@/lib/onboarding";
import { Screen } from "@/components/ui/screen";
import { TechIcon } from "@/components/ui/tech-icon";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = { title: "Profile – Knode" };

export default async function ProfilePage() {
  const auth = await getSession();
  if (!auth) redirect("/sign-in");

  const [profile, [totals]] = await Promise.all([
    db.query.users.findFirst({
      columns: { name: true, email: true, experienceLevel: true, createdAt: true },
      where: eq(users.id, auth.user.id),
      with: { technologies: { with: { technology: { columns: { name: true, slug: true } } } } },
    }),
    db
      .select({ sessions: count(), average: avg(sessions.score) })
      .from(sessions)
      .where(and(eq(sessions.userId, auth.user.id), eq(sessions.status, "COMPLETED"))),
  ]);
  if (!profile) redirect("/sign-in");

  const level = EXPERIENCE_LEVELS.find((l) => l.value === profile.experienceLevel);
  const technologies = profile.technologies.map((t) => t.technology).sort((a, b) => a.name.localeCompare(b.name));
  const completed = Number(totals?.sessions ?? 0);
  const average = totals?.average === null || totals?.average === undefined ? null : Math.round(Number(totals.average));
  const since = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(profile.createdAt);

  return (
    <ViewTransition default="auth-fade">
      <Screen>
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col pt-8">
          <header className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand font-display text-[1.25rem] font-medium text-cream"
            >
              {initials(profile.name)}
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-[1.75rem] font-medium leading-[1.1] tracking-tight">{profile.name}</h1>
              <p className="mt-0.5 truncate text-[14px] text-ink/60">{profile.email}</p>
            </div>
          </header>

          <dl className="mt-8 flex divide-x divide-ink/10 rounded-2xl border border-ink/10 bg-surface">
            <Stat label="Sessions" value={completed > 0 ? String(completed) : "—"} />
            <Stat label="Average" value={average === null ? "—" : `${average}%`} />
            <Stat label="Since" value={since} />
          </dl>

          <Section title="Experience" href="/onboarding">
            {level ? (
              <>
                <p className="text-[15px] text-ink">
                  {level.title}
                  <span className="ml-2 text-ink/50">{level.years}</span>
                </p>
                <p className="mt-1 text-[14px] leading-relaxed text-ink/60">{level.description}</p>
              </>
            ) : (
              <p className="text-[15px] text-ink/50">Not set</p>
            )}
          </Section>

          <Section title="Technologies" href="/onboarding">
            {technologies.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {technologies.map((t) => (
                  <li
                    key={t.slug}
                    className="flex h-9 items-center gap-2 rounded-full border border-ink/10 bg-surface pr-3.5 pl-3 text-[14px]"
                  >
                    <TechIcon slug={t.slug} className="size-4 text-ink/70" />
                    {t.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[15px] text-ink/50">None chosen</p>
            )}
          </Section>

          <div className="mt-auto pt-10">
            <SignOutButton />
          </div>
        </main>
      </Screen>
    </ViewTransition>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 px-4 py-3.5 text-center">
      <dt className="text-[13px] text-ink/55">{label}</dt>
      <dd className="mt-1 font-display text-[15px] font-medium tabular-nums">{value}</dd>
    </div>
  );
}

/** A labelled block with its own edit affordance, so each row is one clear thing. */
function Section({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 border-t border-ink/10 pt-5">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-[13px] font-medium text-ink/55">{title}</h2>
        <Link
          href={href}
          className="rounded text-[13px] font-medium text-brand underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          Edit
        </Link>
      </div>
      {children}
    </section>
  );
}

/** "Ada Lovelace" → "AL"; falls back to the first character. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}
