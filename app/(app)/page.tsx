import { ViewTransition } from "react";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { countInWords, timeAgo } from "@/lib/format";
import { countReadySessions, ensureReadySessions } from "@/lib/questions/ensure-ready";
import type { StartState } from "@/components/home/start-button";
import { HomeScreen } from "@/components/home/home-screen";

export default async function Home() {
  const auth = await getSession();
  if (!auth) redirect("/sign-in");
  const userId = auth.user.id;

  const [profile, ready, inProgress, lastCompleted] = await Promise.all([
    db.query.users.findFirst({
      columns: { firstName: true, experienceLevel: true },
      where: eq(users.id, userId),
      with: { technologies: { columns: { technologyId: true } } },
    }),
    countReadySessions(userId),
    db.query.sessions.findFirst({
      columns: { id: true, startedAt: true },
      where: and(eq(sessions.userId, userId), eq(sessions.status, "IN_PROGRESS")),
      orderBy: desc(sessions.startedAt),
    }),
    db.query.sessions.findFirst({
      columns: { id: true },
      where: and(eq(sessions.userId, userId), eq(sessions.status, "COMPLETED")),
      orderBy: desc(sessions.completedAt),
    }),
  ]);

  if (!profile?.experienceLevel || profile.technologies.length === 0) redirect("/onboarding");

  after(() => ensureReadySessions(userId));

  const state: StartState = inProgress ? "resume" : ready > 0 ? "ready" : "preparing";

  const headline = {
    resume: `Pick up where you left off, ${profile.firstName}.`,
    ready: `Ready when you are, ${profile.firstName}.`,
    preparing: `Give us a minute, ${profile.firstName}.`,
  }[state];

  const status = {
    resume: inProgress?.startedAt ? `Started ${timeAgo(inProgress.startedAt)}.` : "Started earlier.",
    ready: `${capitalize(countInWords(ready))} ${ready === 1 ? "session" : "sessions"} ready.`,
    preparing: lastCompleted ? "Usually under a minute." : "Your first one takes under a minute.",
  }[state];

  return (
    <ViewTransition default="home-enter">
      <HomeScreen headline={headline} state={state} status={status} />
    </ViewTransition>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
