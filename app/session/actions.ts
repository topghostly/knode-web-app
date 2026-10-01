"use server";

import { randomUUID } from "node:crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/db";
import { answers, sessionQuestions, sessions } from "@/db/schema";
import { gradeAnswers } from "@/lib/grading/grade";
import { ensureReadySessions } from "@/lib/questions/ensure-ready";
import { publicQuestionColumns, type PublicQuestion } from "@/lib/questions/public";
import { getSession } from "@/lib/session";

type StartResult =
  | { ok: true; sessionId: string; questions: PublicQuestion[] }
  | { ok: false; message: string };

/**
 * Resumes the user's in-progress session or claims the oldest READY one.
 * Only `PublicQuestion` fields cross to the browser.
 */
export async function startSession(): Promise<StartResult> {
  const auth = await getSession();
  if (!auth) redirect("/sign-in");
  const userId = auth.user.id;

  const inProgress = await db.query.sessions.findFirst({
    columns: { id: true },
    where: and(eq(sessions.userId, userId), eq(sessions.status, "IN_PROGRESS")),
    orderBy: asc(sessions.createdAt),
  });

  let sessionId = inProgress?.id;

  if (!sessionId) {
    const ready = await db.query.sessions.findFirst({
      columns: { id: true },
      where: and(eq(sessions.userId, userId), eq(sessions.status, "READY")),
      orderBy: asc(sessions.createdAt),
    });
    if (!ready) {
      after(() => ensureReadySessions(userId));
      return { ok: false, message: "Your first session is still being prepared. Give it a minute." };
    }
    // The status guard makes a double-click or second tab a no-op instead of
    // two clients believing they own the same session.
    const [claimed] = await db
      .update(sessions)
      .set({ status: "IN_PROGRESS", startedAt: new Date() })
      .where(and(eq(sessions.id, ready.id), eq(sessions.status, "READY")))
      .returning({ id: sessions.id });
    if (!claimed) return startSession();
    sessionId = claimed.id;
  }

  const questions = await db.query.sessionQuestions.findMany({
    columns: publicQuestionColumns,
    where: eq(sessionQuestions.sessionId, sessionId),
    orderBy: asc(sessionQuestions.position),
  });

  after(() => ensureReadySessions(userId));
  return { ok: true, sessionId, questions };
}

type SubmitResult = { ok: true; sessionId: string } | { ok: false; message: string; answersSaved: boolean };

/**
 * Saves every answer first, then grades the whole session in one Gemini call
 * and completes it atomically. If grading fails the answers stay saved and the
 * session stays IN_PROGRESS, so calling this again simply re-grades.
 */
export async function submitSession(input: {
  sessionId: string;
  answers: { questionId: string; answer: string }[];
}): Promise<SubmitResult> {
  const auth = await getSession();
  if (!auth) redirect("/sign-in");
  const userId = auth.user.id;

  const session = await db.query.sessions.findFirst({
    columns: { id: true, status: true },
    where: and(eq(sessions.id, input.sessionId), eq(sessions.userId, userId)),
    with: {
      questions: {
        orderBy: asc(sessionQuestions.position),
        with: { technology: { columns: { slug: true } } },
      },
    },
  });
  if (!session) return { ok: false, message: "That session doesn't exist.", answersSaved: false };
  if (session.status !== "IN_PROGRESS") {
    return { ok: false, message: "That session isn't in progress.", answersSaved: false };
  }

  const submitted = new Map(input.answers.map((a) => [a.questionId, a.answer]));
  if (submitted.size !== session.questions.length || session.questions.some((q) => !submitted.has(q.id))) {
    return { ok: false, message: "Every question needs an answer entry before submitting.", answersSaved: false };
  }

  const now = new Date();
  const rows = session.questions.map((q) => ({
    id: randomUUID(),
    questionId: q.id,
    userAnswer: (submitted.get(q.id) ?? "").trim(),
    answeredAt: now,
  }));

  try {
    await db
      .insert(answers)
      .values(rows)
      .onConflictDoUpdate({
        target: answers.questionId,
        set: {
          userAnswer: sql`excluded.user_answer`,
          answeredAt: sql`excluded.answered_at`,
          score: null,
          rubricResult: null,
          feedback: null,
          missingPoints: null,
          betterAnswer: null,
          gradedAt: null,
        },
      });
  } catch (error) {
    console.error("submitSession: failed to save answers", error);
    return { ok: false, message: "Couldn't save your answers. Try again.", answersSaved: false };
  }

  let graded;
  try {
    graded = await gradeAnswers(
      session.questions.map((q) => ({
        key: `q${q.position}`,
        technology: q.technology.slug,
        topic: q.topic,
        questionText: q.questionText,
        answerType: q.answerType,
        gradingRubric: q.gradingRubric,
        options: q.options,
        correctOption: q.correctOption,
        codeLanguage: q.codeLanguage,
        userAnswer: submitted.get(q.id)!.trim(),
      })),
    );
  } catch (error) {
    console.error("submitSession: grading failed", error);
    return { ok: false, message: "Your answers are saved, but grading didn't go through. Try again.", answersSaved: true };
  }

  const byKey = new Map(graded.evaluations.map((e) => [e.key, e]));
  const gradedAt = new Date();
  const total = session.questions.reduce((n, q) => n + byKey.get(`q${q.position}`)!.score, 0);
  // Stored as a percentage of the points available (10 per question).
  const sessionScore = ((total / (session.questions.length * 10)) * 100).toFixed(2);

  const updates = session.questions.map((q) => {
    const e = byKey.get(`q${q.position}`)!;
    return db
      .update(answers)
      .set({
        score: e.score,
        rubricResult: e.rubricResult,
        feedback: e.feedback,
        missingPoints: e.missingPoints,
        betterAnswer: e.betterAnswer,
        gradedAt,
      })
      .where(eq(answers.questionId, q.id));
  });

  try {
    await db.batch([
      db
        .update(sessions)
        .set({ status: "COMPLETED", score: sessionScore, completedAt: gradedAt })
        .where(eq(sessions.id, session.id)),
      ...updates,
    ]);
  } catch (error) {
    console.error("submitSession: failed to store grades", error);
    return { ok: false, message: "Graded, but couldn't save the results. Try again.", answersSaved: true };
  }

  return { ok: true, sessionId: session.id };
}
