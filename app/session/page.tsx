import type { Metadata } from "next";
import { ViewTransition } from "react";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getSession } from "@/lib/session";
import { peekNextSession } from "@/lib/questions/peek";
import { ensureReadySessions } from "@/lib/questions/ensure-ready";
import { Brief } from "@/components/session/brief";
import { BackLink } from "@/components/ui/back-link";
import { Intro } from "@/components/ui/intro";
import { Screen } from "@/components/ui/screen";

export const metadata: Metadata = { title: "Session – Knode" };

export default async function SessionBriefPage() {
  const auth = await getSession();
  if (!auth) redirect("/sign-in");

  const peek = await peekNextSession(auth.user.id);
  if (!peek) {
    after(() => ensureReadySessions(auth.user.id));
    return (
      <ViewTransition default="auth-fade">
        <Screen withNav={false}>
          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
            <header className="flex h-10 shrink-0 items-center">
              <BackLink href="/">Home</BackLink>
            </header>
            <Intro className="flex flex-1 flex-col justify-center py-8 sm:py-12">
              <h1 className="font-display text-[2rem] font-medium leading-[1.08] tracking-tight text-balance sm:text-[2.5rem]">
                Still preparing your session.
              </h1>
              <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-ink/75 sm:text-[16px]">
                Ten questions are being written around the technologies you chose, usually under a minute. Head back and the
                button will light up when they&rsquo;re ready.
              </p>
            </Intro>
          </div>
        </Screen>
      </ViewTransition>
    );
  }

  return (
    <ViewTransition default="auth-fade">
      <Brief
        sessionId={peek.id}
        resuming={peek.status === "IN_PROGRESS"}
        questions={peek.questionIds.map((id, i) => ({ id, technology: peek.technologyNames[i], answerType: peek.answerTypes[i] }))}
        topics={peek.topics}
      />
    </ViewTransition>
  );
}
