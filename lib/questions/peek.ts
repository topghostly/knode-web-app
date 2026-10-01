import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { sessionQuestions, sessions, technologies } from "@/db/schema";

export type SessionPeek = {
  id: string;
  status: "READY" | "IN_PROGRESS";
  startedAt: Date | null;
  questionIds: string[];
  technologyNames: string[]; // one per question, in position order
  answerTypes: ("TEXT" | "CODE" | "MULTIPLE_CHOICE")[];
  topics: string[]; // one per question, kebab-case
};

/**
 * What the brief screen needs: the session the user would resume or start
 * next, described without exposing any question text (topics are fine).
 * Nothing is claimed.
 */
export async function peekNextSession(userId: string): Promise<SessionPeek | null> {
  const candidates = await db
    .select({ id: sessions.id, status: sessions.status, startedAt: sessions.startedAt })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), inArray(sessions.status, ["IN_PROGRESS", "READY"])))
    .orderBy(asc(sessions.createdAt));

  const next = candidates.find((s) => s.status === "IN_PROGRESS") ?? candidates.find((s) => s.status === "READY");
  if (!next) return null;

  const rows = await db
    .select({
      id: sessionQuestions.id,
      answerType: sessionQuestions.answerType,
      topic: sessionQuestions.topic,
      technology: technologies.name,
    })
    .from(sessionQuestions)
    .innerJoin(technologies, eq(sessionQuestions.technologyId, technologies.id))
    .where(eq(sessionQuestions.sessionId, next.id))
    .orderBy(asc(sessionQuestions.position));

  return {
    id: next.id,
    status: next.status as SessionPeek["status"],
    startedAt: next.startedAt,
    questionIds: rows.map((r) => r.id),
    technologyNames: rows.map((r) => r.technology),
    answerTypes: rows.map((r) => r.answerType),
    topics: rows.map((r) => r.topic),
  };
}
