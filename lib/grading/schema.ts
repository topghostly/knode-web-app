import { z } from "zod";
import type { RubricCriterion, RubricResultItem } from "@/db/schema";
import type { AnswerType } from "@/lib/questions/schema";

// Runtime imports limited to zod so this runs under `node --test`.

/** What the grader needs per question. `key` is the short id ("q1") sent to the model. */
export type GradingInput = {
  key: string;
  answerType: AnswerType;
  gradingRubric: RubricCriterion[];
  options: string[] | null;
  correctOption: string | null;
  userAnswer: string;
};

/** Shape schema sent to Gemini. Score is derived, criteria are not echoed. */
export const gradingResponseShape = z.object({
  evaluations: z.array(
    z.object({
      questionId: z.string().describe("The supplied question id, e.g. q3."),
      awardedPoints: z
        .array(z.int().min(0).max(10))
        .describe("One integer per rubric criterion, in the order supplied, each 0..maxPoints."),
      feedback: z.string().describe("1-3 specific technical sentences."),
      missingPoints: z.array(z.string()).describe("Important ideas not demonstrated. Empty on full credit."),
      betterAnswer: z.string().nullable().describe("A concise stronger answer, or null when the answer was strong."),
    }),
  ),
});

export type Evaluation = {
  key: string;
  score: number;
  rubricResult: RubricResultItem[];
  feedback: string;
  missingPoints: string[];
  betterAnswer: string | null;
};

export type GradingValidation = { evaluations: Evaluation[]; issues: string[] };

export function isCorrectChoice(input: GradingInput): boolean {
  return input.correctOption !== null && input.userAnswer.trim() === input.correctOption.trim();
}

/**
 * All-or-nothing: a grading response is only trusted when every supplied
 * question is evaluated exactly once and every rubric line is in range.
 * Multiple choice is scored here, not by the model.
 */
export function validateGradingResponse(raw: unknown, inputs: GradingInput[]): GradingValidation {
  const parsed = gradingResponseShape.safeParse(raw);
  if (!parsed.success) {
    return { evaluations: [], issues: [`response does not match schema: ${z.prettifyError(parsed.error).replace(/\n\s*/g, " ")}`] };
  }

  const byKey = new Map(inputs.map((i) => [i.key, i]));
  const seen = new Set<string>();
  const issues: string[] = [];
  const evaluations: Evaluation[] = [];

  for (const e of parsed.data.evaluations) {
    const input = byKey.get(e.questionId);
    if (!input) {
      issues.push(`${e.questionId}: not a supplied question`);
      continue;
    }
    if (seen.has(e.questionId)) {
      issues.push(`${e.questionId}: evaluated more than once`);
      continue;
    }
    seen.add(e.questionId);

    const rubric = input.gradingRubric;
    let awarded = e.awardedPoints;

    if (input.answerType === "MULTIPLE_CHOICE") {
      const correct = isCorrectChoice(input);
      awarded = rubric.map((c) => (correct ? c.points : 0));
    } else {
      if (awarded.length !== rubric.length) {
        issues.push(`${e.questionId}: ${awarded.length} awardedPoints for ${rubric.length} criteria`);
        continue;
      }
      const bad = awarded.findIndex((p, i) => p < 0 || p > rubric[i].points);
      if (bad !== -1) {
        issues.push(`${e.questionId}: awardedPoints[${bad}]=${awarded[bad]} exceeds or underflows max ${rubric[bad].points}`);
        continue;
      }
    }

    const score = awarded.reduce((n, p) => n + p, 0);
    const total = rubric.reduce((n, c) => n + c.points, 0);
    const feedback = e.feedback.trim();
    if (!feedback) {
      issues.push(`${e.questionId}: empty feedback`);
      continue;
    }

    evaluations.push({
      key: input.key,
      score,
      rubricResult: rubric.map((c, i) => ({ criterion: c.criterion, maxPoints: c.points, awardedPoints: awarded[i] })),
      feedback,
      missingPoints: score >= total ? [] : e.missingPoints.map((m) => m.trim()).filter(Boolean),
      betterAnswer: e.betterAnswer?.trim() || null,
    });
  }

  for (const key of byKey.keys()) {
    if (!seen.has(key)) issues.push(`${key}: no evaluation returned`);
  }

  return issues.length > 0 ? { evaluations: [], issues } : { evaluations, issues };
}
