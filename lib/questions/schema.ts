import { z } from "zod";
import type { RubricCriterion } from "@/db/schema";

// Keep this module free of runtime imports other than zod: it runs under
// `node --test` without a bundler, and the alias-free import graph is what
// lets the DB layer stay out of the validation tests.

export const ANSWER_TYPES = ["TEXT", "CODE", "MULTIPLE_CHOICE"] as const;
export const COGNITIVE_TASKS = [
  "debug",
  "read",
  "predict",
  "review",
  "tradeoff",
  "architect",
  "implement",
  "explain",
] as const;

export type AnswerType = (typeof ANSWER_TYPES)[number];
export type CognitiveTask = (typeof COGNITIVE_TASKS)[number];

export const RUBRIC_TOTAL = 10;
export const RUBRIC_CORE_MIN = 4;
export const MC_OPTION_COUNT = 4;

/**
 * Shape schema: what we ask Gemini for. Deliberately loose (no cross-field
 * rules) because structured-output support for unions and refinements is
 * patchy. Converted to JSON Schema for `responseJsonSchema`.
 */
export const generatedQuestionShape = z.object({
  technology: z.string().describe("One of the supplied technology slugs, exactly."),
  topic: z.string().describe("kebab-case name of the concept being tested."),
  cognitiveTask: z.enum(COGNITIVE_TASKS),
  answerType: z.enum(ANSWER_TYPES),
  questionText: z.string().describe("Markdown. Use fenced code blocks for code, config, logs and SQL."),
  gradingRubric: z
    .array(z.object({ criterion: z.string(), points: z.int().min(1).max(RUBRIC_TOTAL) }))
    .describe("Observable criteria whose points sum to exactly 10."),
  options: z.array(z.string()).nullable().describe("Exactly 4 for MULTIPLE_CHOICE, otherwise null."),
  correctOptionIndex: z
    .int()
    .min(0)
    .max(MC_OPTION_COUNT - 1)
    .nullable()
    .describe("0-based index into options for MULTIPLE_CHOICE, otherwise null."),
  codeLanguage: z.string().nullable().describe("Required for CODE, otherwise null."),
});

export const generatedSessionShape = z.object({
  questions: z.array(generatedQuestionShape),
});

export type GeneratedQuestionRaw = z.infer<typeof generatedQuestionShape>;

/** A question that passed every check and is ready to insert. */
export type ValidatedQuestion = {
  technology: string;
  topic: string;
  cognitiveTask: CognitiveTask;
  questionText: string;
  gradingRubric: RubricCriterion[];
} & (
  | { answerType: "TEXT"; options: null; correctOption: null; codeLanguage: null }
  | { answerType: "CODE"; options: null; correctOption: null; codeLanguage: string }
  | { answerType: "MULTIPLE_CHOICE"; options: string[]; correctOption: string; codeLanguage: null }
);

export function toKebabCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function strictQuestion(slugs: readonly string[]) {
  const slugSet = new Set(slugs);
  return generatedQuestionShape
    .extend({
      technology: z.string().refine((s) => slugSet.has(s), { error: "technology is not one of the supplied slugs" }),
      topic: z.string().transform(toKebabCase).pipe(z.string().min(1, "topic is empty")),
      questionText: z.string().trim().min(20, "questionText is too short"),
      gradingRubric: z
        .array(z.object({ criterion: z.string().trim().min(1), points: z.int().min(1) }))
        .min(1)
        .max(4)
        .refine((r) => r.reduce((n, c) => n + c.points, 0) === RUBRIC_TOTAL, {
          error: `rubric points must sum to ${RUBRIC_TOTAL}`,
        })
        .refine((r) => Math.max(...r.map((c) => c.points)) >= RUBRIC_CORE_MIN, {
          error: `core rubric criterion must be worth at least ${RUBRIC_CORE_MIN}`,
        }),
    })
    .transform((q, ctx): ValidatedQuestion | never => {
      const base = {
        technology: q.technology,
        topic: q.topic,
        cognitiveTask: q.cognitiveTask,
        questionText: q.questionText,
        gradingRubric: q.gradingRubric,
      };
      switch (q.answerType) {
        case "TEXT":
          // Stray fields on the wrong answer type are a model slip, not a
          // reason to discard an otherwise good question.
          return { ...base, answerType: "TEXT", options: null, correctOption: null, codeLanguage: null };
        case "CODE": {
          const lang = q.codeLanguage?.trim().toLowerCase();
          if (!lang) {
            ctx.addIssue({ code: "custom", path: ["codeLanguage"], message: "CODE requires codeLanguage" });
            return z.NEVER;
          }
          return { ...base, answerType: "CODE", options: null, correctOption: null, codeLanguage: lang };
        }
        case "MULTIPLE_CHOICE": {
          const options = q.options?.map((o) => o.trim()) ?? [];
          if (options.length !== MC_OPTION_COUNT || options.some((o) => !o)) {
            ctx.addIssue({ code: "custom", path: ["options"], message: `MULTIPLE_CHOICE requires ${MC_OPTION_COUNT} options` });
            return z.NEVER;
          }
          if (new Set(options).size !== options.length) {
            ctx.addIssue({ code: "custom", path: ["options"], message: "options must be distinct" });
            return z.NEVER;
          }
          const idx = q.correctOptionIndex;
          if (idx === null || idx < 0 || idx >= options.length) {
            ctx.addIssue({ code: "custom", path: ["correctOptionIndex"], message: "correctOptionIndex must point at an option" });
            return z.NEVER;
          }
          return { ...base, answerType: "MULTIPLE_CHOICE", options, correctOption: options[idx], codeLanguage: null };
        }
      }
    });
}

export type ValidationResult = { questions: ValidatedQuestion[]; issues: string[] };

/**
 * Validates each question independently so one bad rubric doesn't discard
 * the other nine. `issues` is human-readable, for logs and retry prompts.
 */
export function validateGeneratedQuestions(raw: unknown, opts: { slugs: readonly string[] }): ValidationResult {
  const envelope = z.object({ questions: z.array(z.unknown()) }).safeParse(raw);
  if (!envelope.success) {
    return { questions: [], issues: [`response is not { questions: [...] }: ${z.prettifyError(envelope.error)}`] };
  }

  const schema = strictQuestion(opts.slugs);
  const questions: ValidatedQuestion[] = [];
  const issues: string[] = [];
  envelope.data.questions.forEach((item, i) => {
    const result = schema.safeParse(item);
    if (result.success) questions.push(result.data);
    else issues.push(`question ${i + 1}: ${z.prettifyError(result.error).replace(/\n\s*/g, " ")}`);
  });
  return { questions, issues };
}
