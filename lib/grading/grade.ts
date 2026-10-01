import "server-only";
import { GEMINI_MODEL, generateJson, toGeminiJsonSchema } from "@/lib/ai/gemini";
import { GRADING_PROMPT_VERSION, GRADING_SYSTEM_PROMPT } from "./prompt";
import { gradingResponseShape, isCorrectChoice, validateGradingResponse, type Evaluation, type GradingInput } from "./schema";

const responseJsonSchema = toGeminiJsonSchema(gradingResponseShape);
const MAX_ATTEMPTS = 2;

export type GradableQuestion = GradingInput & {
  technology: string;
  topic: string;
  questionText: string;
  codeLanguage: string | null;
};

export type GradedSession = {
  evaluations: Evaluation[];
  model: string;
  promptVersion: string;
};

/** Grades a whole session in one Gemini call (retried once on invalid output). */
export async function gradeAnswers(questions: GradableQuestion[]): Promise<GradedSession> {
  const payload = questions.map((q) => ({
    questionId: q.key,
    technology: q.technology,
    topic: q.topic,
    questionText: q.questionText,
    answerType: q.answerType,
    gradingRubric: q.gradingRubric,
    userAnswer: q.userAnswer,
    ...(q.answerType === "CODE" && { codeLanguage: q.codeLanguage }),
    ...(q.answerType === "MULTIPLE_CHOICE" && {
      options: q.options,
      correctOption: q.correctOption,
      selectedCorrectly: isCorrectChoice(q),
    }),
  }));

  const contents = `Grade the following ${questions.length} answers.\n\n${JSON.stringify(payload, null, 2)}`;

  let lastIssues: string[] = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const raw = await generateJson({
      systemInstruction: GRADING_SYSTEM_PROMPT,
      contents,
      responseJsonSchema,
      temperature: 0.2,
    });

    const { evaluations, issues } = validateGradingResponse(raw, questions);
    if (issues.length === 0) {
      return { evaluations, model: GEMINI_MODEL, promptVersion: GRADING_PROMPT_VERSION };
    }
    console.warn(`gradeAnswers: attempt ${attempt} rejected`, issues);
    lastIssues = issues;
  }

  throw new Error(`gradeAnswers: invalid grading output after ${MAX_ATTEMPTS} attempts. Issues: ${lastIssues.join(" | ")}`);
}
