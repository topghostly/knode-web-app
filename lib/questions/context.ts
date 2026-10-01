export const QUESTIONS_PER_SESSION = 10;
export const RECENT_QUESTION_LIMIT = 20;
const RECENT_EXCERPT_CHARS = 160;

export type GenerationContext = {
  technologies: { slug: string; name: string }[];
  recentQuestions: { technology: string; topic: string; questionText: string }[];
  experienceLevel: string | null;
  count?: number;
};

/**
 * The user turn for the generation call. Plain text sections mirror the
 * SESSION CONTEXT names the system prompt promises; recent questions are
 * excerpted so 20 of them stay cheap.
 */
export function buildGenerationContents(ctx: GenerationContext): string {
  const count = ctx.count ?? QUESTIONS_PER_SESSION;

  const technologies = ctx.technologies.map((t) => `- ${t.slug} (${t.name})`).join("\n");

  const recent =
    ctx.recentQuestions.length === 0
      ? "None yet. This is the learner's first session."
      : ctx.recentQuestions
          .slice(0, RECENT_QUESTION_LIMIT)
          .map((q, i) => `${i + 1}. [${q.technology} / ${q.topic}] ${excerpt(q.questionText)}`)
          .join("\n");

  const configuration = [
    `- questions: ${count}`,
    `- learner experience level: ${ctx.experienceLevel ?? "unspecified"}`,
    "- answer-type distribution: default",
  ].join("\n");

  return `Generate a new Knode session.

TECHNOLOGIES:
${technologies}

RECENT QUESTIONS (newest first):
${recent}

SESSION CONFIGURATION:
${configuration}`;
}

function excerpt(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > RECENT_EXCERPT_CHARS ? `${flat.slice(0, RECENT_EXCERPT_CHARS - 1)}…` : flat;
}
