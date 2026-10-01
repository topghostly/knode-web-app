import type { Metadata } from "next";
import { ViewTransition } from "react";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { sessionQuestions, sessions } from "@/db/schema";
import { getSession } from "@/lib/session";
import { questionExcerpt } from "@/lib/questions/excerpt";
import { QuestionBody } from "@/components/session/question-body";
import { SessionDeck, type DeckQuestion } from "@/components/session/session-deck";

export const metadata: Metadata = { title: "Session – Knode" };

export default async function SessionDeckPage({ params }: PageProps<"/session/[id]">) {
  const { id } = await params;
  const auth = await getSession();
  if (!auth) redirect("/sign-in");

  const session = await db.query.sessions.findFirst({
    columns: { id: true, status: true, startedAt: true },
    where: and(eq(sessions.id, id), eq(sessions.userId, auth.user.id)),
    with: {
      questions: {
        // Only what the browser may see: no rubric, no correct option, no metadata.
        columns: { id: true, position: true, questionText: true, answerType: true, options: true, codeLanguage: true, topic: true },
        orderBy: asc(sessionQuestions.position),
        with: { technology: { columns: { name: true, slug: true } } },
      },
    },
  });

  if (!session) notFound();
  if (session.status === "COMPLETED") redirect(`/session/${id}/results`);
  if (session.status !== "IN_PROGRESS") redirect("/session");

  const questions: DeckQuestion[] = session.questions.map((q) => ({
    id: q.id,
    position: q.position,
    answerType: q.answerType,
    options: q.options,
    codeLanguage: q.codeLanguage,
    technology: q.technology.name,
    technologySlug: q.technology.slug,
    topic: q.topic.replace(/-/g, " "),
    excerpt: questionExcerpt(q.questionText, 120),
    body: <QuestionBody markdown={q.questionText} />,
  }));

  return (
    <ViewTransition default="auth-fade">
      <SessionDeck sessionId={session.id} startedAt={(session.startedAt ?? new Date()).toISOString()} questions={questions} />
    </ViewTransition>
  );
}
