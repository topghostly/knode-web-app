import type { SessionQuestion } from "@/db/schema";

/**
 * The only question columns a browser may ever receive. `gradingRubric`,
 * `correctOption` and `metadata` stay on the server until results.
 * Use this with `columns:` in relational queries or `pick` on a full row.
 */
export const publicQuestionColumns = {
  id: true,
  position: true,
  questionText: true,
  answerType: true,
  options: true,
  codeLanguage: true,
} as const satisfies Partial<Record<keyof SessionQuestion, true>>;

export type PublicQuestion = Pick<SessionQuestion, keyof typeof publicQuestionColumns>;

export function toPublicQuestion(q: SessionQuestion): PublicQuestion {
  return {
    id: q.id,
    position: q.position,
    questionText: q.questionText,
    answerType: q.answerType,
    options: q.options,
    codeLanguage: q.codeLanguage,
  };
}
