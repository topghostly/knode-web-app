import "server-only";
import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { sessionQuestions, sessions, technologies, userTechnologies, users } from "@/db/schema";
import { RECENT_QUESTION_LIMIT } from "./context";
import { generateQuestions } from "./generate";

/**
 * Generates one batch for the user and stores it as a READY session with its
 * questions in a single atomic batch. Returns the new session id.
 */
export async function createReadySession(userId: string): Promise<string> {
  const [profile, techs, recent] = await Promise.all([
    db.query.users.findFirst({ columns: { experienceLevel: true }, where: eq(users.id, userId) }),
    db
      .select({ id: technologies.id, slug: technologies.slug, name: technologies.name })
      .from(userTechnologies)
      .innerJoin(technologies, eq(userTechnologies.technologyId, technologies.id))
      .where(eq(userTechnologies.userId, userId)),
    // Every session counts, including READY ones, so the three prepared
    // batches don't overlap with each other.
    db
      .select({
        technology: technologies.slug,
        topic: sessionQuestions.topic,
        questionText: sessionQuestions.questionText,
      })
      .from(sessionQuestions)
      .innerJoin(sessions, eq(sessionQuestions.sessionId, sessions.id))
      .innerJoin(technologies, eq(sessionQuestions.technologyId, technologies.id))
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessionQuestions.createdAt), desc(sessionQuestions.position))
      .limit(RECENT_QUESTION_LIMIT),
  ]);

  if (techs.length === 0) {
    throw new Error(`createReadySession: user ${userId} has no technologies selected`);
  }

  const generated = await generateQuestions({
    technologies: techs,
    recentQuestions: recent,
    experienceLevel: profile?.experienceLevel ?? null,
  });

  const technologyIdBySlug = new Map(techs.map((t) => [t.slug, t.id]));
  const sessionId = randomUUID();

  await db.batch([
    db.insert(sessions).values({
      id: sessionId,
      userId,
      status: "READY",
      generatorVersion: generated.promptVersion,
    }),
    db.insert(sessionQuestions).values(
      generated.questions.map((q, i) => ({
        id: randomUUID(),
        sessionId,
        technologyId: technologyIdBySlug.get(q.technology)!,
        position: i + 1,
        questionText: q.questionText,
        answerType: q.answerType,
        gradingRubric: q.gradingRubric,
        options: q.options,
        correctOption: q.correctOption,
        codeLanguage: q.codeLanguage,
        topic: q.topic,
        metadata: { generatorModel: generated.model, cognitiveTask: q.cognitiveTask },
      })),
    ),
  ]);

  return sessionId;
}
