import type { ExperienceLevel } from "@/db/schema";

export const MIN_TECHNOLOGIES = 1;
export const MAX_TECHNOLOGIES = 6;

export const CATEGORY_ORDER = ["Languages", "Frontend", "Backend", "Data", "Infra & Cloud"];

export const EXPERIENCE_LEVELS: {
  value: ExperienceLevel;
  title: string;
  years: string;
  description: string;
}[] = [
  {
    value: "JUNIOR",
    title: "Getting established",
    years: "0–2 yrs",
    description: "Shipping features and still building instincts.",
  },
  {
    value: "MID",
    title: "Mid-level",
    years: "2–5 yrs",
    description: "Own features end to end, at home in the codebase.",
  },
  {
    value: "SENIOR",
    title: "Senior",
    years: "5–10 yrs",
    description: "Design systems, review code, make the trade-offs.",
  },
  {
    value: "STAFF",
    title: "Staff and beyond",
    years: "10+ yrs",
    description: "Set direction across teams and systems.",
  },
];
