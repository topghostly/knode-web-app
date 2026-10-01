// Explicit extension so `node --test` can resolve it without a bundler.
import { countInWords, listInProse } from "./format.ts";

export type BriefInput = {
  technologies: string[]; // one entry per question, display names
  answerTypes: ("TEXT" | "CODE" | "MULTIPLE_CHOICE")[];
};

/** Distinct technologies with counts — most frequent first, ties by name. */
export function technologyCounts(names: string[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
}

/** "4 PostgreSQL, 3 React and 3 TypeScript." */
export function technologyMix(names: string[]): string {
  return `${listInProse(technologyCounts(names).map(({ name, count }) => `${count} ${name}`))}.`;
}

/** "Six written, three multiple choice and one code." Omits absent kinds. */
export function answerTypeMix(types: BriefInput["answerTypes"]): string {
  const n = (t: BriefInput["answerTypes"][number]) => types.filter((x) => x === t).length;
  const parts: string[] = [];
  const push = (count: number, singular: string, plural = singular) => {
    if (count > 0) parts.push(`${countInWords(count)} ${count === 1 ? singular : plural}`);
  };
  push(n("TEXT"), "written");
  push(n("MULTIPLE_CHOICE"), "multiple choice");
  push(n("CODE"), "code");
  const sentence = listInProse(parts);
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
}

const GRADING = "Everything is graded together at the end, then you walk through the feedback one question at a time.";

/**
 * The brief's lead: what the session is and how it works, in two or three
 * sentences built from what the peek already knows. Resume copy leads with
 * progress instead of the format.
 */
export function leadParagraph({
  total,
  technologies,
  hasCode,
  resuming,
  answered,
}: {
  total: number;
  technologies: string[];
  hasCode: boolean;
  resuming: boolean;
  answered: number;
}): string {
  const names = technologyCounts(technologies).map((t) => t.name);
  const across = names.length === 1 ? `on ${names[0]}` : `across ${listInProse(names)}`;

  if (resuming) {
    const progress = answered > 0 ? `You're ${countInWords(answered)} of ${countInWords(total)} in` : "Nothing answered yet";
    const state = answered > 0 ? "Your answers and timer are where you left them." : "Your timer is where you left it.";
    return `${progress}, ${across}. ${state} ${GRADING}`;
  }

  const count = capitalize(countInWords(total));
  const answer = hasCode ? "Answer in your own words; code is read by the grader, not run." : "Answer in your own words.";
  return `${count} questions ${across}, about ${countInWords(total)} minutes. ${answer} ${GRADING}`;
}

const MAX_TOPICS = 6;

/** "Covers connection pooling, react hooks and generics." Topics arrive kebab-case. */
export function topicsLine(topics: string[]): string {
  const unique = [...new Set(topics.map((t) => t.replace(/-/g, " ").trim()).filter(Boolean))];
  if (unique.length === 0) return "";
  const shown = unique.slice(0, MAX_TOPICS);
  const rest = unique.length - shown.length;
  const list = rest > 0 ? `${shown.join(", ")} and ${countInWords(rest)} more` : listInProse(shown);
  return `Covers ${list}.`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
