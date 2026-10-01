import type { Metadata } from "next";
import { ViewTransition } from "react";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { sessionQuestions, sessions } from "@/db/schema";
import { getSession } from "@/lib/session";
import { questionExcerpt } from "@/lib/questions/excerpt";
import { QuestionBody } from "@/components/session/question-body";
import { ResultsDeck, type ReviewQuestion } from "@/components/results/results-deck";

export const metadata: Metadata = { title: "Results – Knode" };

export default async function ResultsPage({ params }: PageProps<"/session/[id]/results">) {
  const { id } = await params;
  const auth = await getSession();
  if (!auth) redirect("/sign-in");

  const session = await db.query.sessions.findFirst({
    columns: { id: true, status: true, score: true },
    where: and(eq(sessions.id, id), eq(sessions.userId, auth.user.id)),
    with: {
      // After grading the rubric and correct option are part of the review.
      questions: {
        orderBy: asc(sessionQuestions.position),
        with: { technology: { columns: { name: true, slug: true } }, answer: true },
      },
    },
  });
  if (!session) notFound();
  if (session.status !== "COMPLETED") redirect(`/session/${id}`);

  const questions: ReviewQuestion[] = session.questions.map((q) => {
    const a = q.answer;
    const userAnswer = a?.userAnswer ?? "";
    return {
      id: q.id,
      position: q.position,
      technology: q.technology.name,
      technologySlug: q.technology.slug,
      topic: q.topic.replace(/-/g, " "),
      excerpt: questionExcerpt(q.questionText, 120),
      answerType: q.answerType,
      options: q.options,
      correctOption: q.correctOption,
      userAnswer,
      score: a?.score ?? 0,
      rubricResult: a?.rubricResult ?? q.gradingRubric.map((c) => ({ criterion: c.criterion, maxPoints: c.points, awardedPoints: 0 })),
      feedback: a?.feedback ?? "This answer wasn't graded.",
      missingPoints: a?.missingPoints ?? [],
      questionBody: <QuestionBody markdown={q.questionText} />,
      answerBody:
        q.answerType === "CODE" && userAnswer.trim() ? (
          <QuestionBody markdown={`\`\`\`${q.codeLanguage ?? ""}\n${userAnswer}\n\`\`\``} />
        ) : null,
      betterAnswerBody: a?.betterAnswer ? <QuestionBody markdown={a.betterAnswer} /> : null,
    };
  });

  return (
    <ViewTransition default="auth-fade">
      <ResultsDeck sessionId={session.id} score={Math.round(Number(session.score ?? 0))} questions={questions} />
    </ViewTransition>
  );
}
