import "server-only";
import { GEMINI_MODEL, generateJson, toGeminiJsonSchema } from "@/lib/ai/gemini";
import { buildGenerationContents, QUESTIONS_PER_SESSION, type GenerationContext } from "./context";
import { QUESTION_PROMPT_VERSION, QUESTION_SYSTEM_PROMPT } from "./prompt";
import { generatedSessionShape, validateGeneratedQuestions, type ValidatedQuestion } from "./schema";

const responseJsonSchema = toGeminiJsonSchema(generatedSessionShape);
const MAX_ATTEMPTS = 2;

export type GeneratedSession = {
  questions: ValidatedQuestion[];
  model: string;
  promptVersion: string;
};

/**
 * One Gemini call (retried once) producing a fully validated set of
 * questions. Pure with respect to the database: callers load context and
 * persist the result.
 */
export async function generateQuestions(ctx: GenerationContext): Promise<GeneratedSession> {
  const count = ctx.count ?? QUESTIONS_PER_SESSION;
  const slugs = ctx.technologies.map((t) => t.slug);
  const contents = buildGenerationContents({ ...ctx, count });

  let lastIssues: string[] = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const raw = await generateJson({
      systemInstruction: QUESTION_SYSTEM_PROMPT,
      contents,
      responseJsonSchema,
      temperature: 0.8,
    });

    const { questions, issues } = validateGeneratedQuestions(raw, { slugs });
    if (issues.length > 0) {
      console.warn(`generateQuestions: attempt ${attempt} dropped ${issues.length} question(s)`, issues);
    }
    if (questions.length >= count) {
      return { questions: questions.slice(0, count), model: GEMINI_MODEL, promptVersion: QUESTION_PROMPT_VERSION };
    }
    lastIssues = issues;
  }

  throw new Error(
    `generateQuestions: fewer than ${count} valid questions after ${MAX_ATTEMPTS} attempts. Issues: ${lastIssues.join(" | ")}`,
  );
}
