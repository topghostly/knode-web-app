import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { answerTypeMix, leadParagraph, technologyCounts, technologyMix, topicsLine } from "./session-brief.ts";

const TEN = ["React", "PostgreSQL", "TypeScript", "PostgreSQL", "React", "PostgreSQL", "TypeScript", "React", "TypeScript", "PostgreSQL"];

describe("session brief copy", () => {
  it("orders technologies by count then name", () => {
    assert.equal(technologyMix(TEN), "4 PostgreSQL, 3 React and 3 TypeScript.");
    assert.equal(technologyMix(["Go"]), "1 Go.");
  });

  it("exposes the same ordering as counts for the legend", () => {
    assert.deepEqual(technologyCounts(TEN), [
      { name: "PostgreSQL", count: 4 },
      { name: "React", count: 3 },
      { name: "TypeScript", count: 3 },
    ]);
  });

  it("describes the answer-type mix in words and skips absent kinds", () => {
    assert.equal(
      answerTypeMix(["TEXT", "TEXT", "TEXT", "TEXT", "TEXT", "TEXT", "MULTIPLE_CHOICE", "MULTIPLE_CHOICE", "MULTIPLE_CHOICE", "CODE"]),
      "Six written, three multiple choice and one code.",
    );
    assert.equal(answerTypeMix(["TEXT", "CODE"]), "One written and one code.");
    assert.equal(answerTypeMix(["MULTIPLE_CHOICE"]), "One multiple choice.");
  });

  it("writes a fresh-session lead from the mix", () => {
    assert.equal(
      leadParagraph({ total: 10, technologies: TEN, hasCode: true, resuming: false, answered: 0 }),
      "Ten questions across PostgreSQL, React and TypeScript, about ten minutes. Answer in your own words; code is read by the grader, not run. Everything is graded together at the end, then you walk through the feedback one question at a time.",
    );
  });

  it("uses 'on' for a single technology and drops the code note when there is none", () => {
    assert.equal(
      leadParagraph({ total: 10, technologies: Array(10).fill("Go"), hasCode: false, resuming: false, answered: 0 }),
      "Ten questions on Go, about ten minutes. Answer in your own words. Everything is graded together at the end, then you walk through the feedback one question at a time.",
    );
  });

  it("writes a resume lead with progress", () => {
    assert.equal(
      leadParagraph({ total: 10, technologies: TEN, hasCode: true, resuming: true, answered: 4 }),
      "You're four of ten in, across PostgreSQL, React and TypeScript. Your answers and timer are where you left them. Everything is graded together at the end, then you walk through the feedback one question at a time.",
    );
    assert.equal(
      leadParagraph({ total: 10, technologies: TEN, hasCode: false, resuming: true, answered: 0 }),
      "Nothing answered yet, across PostgreSQL, React and TypeScript. Your timer is where you left it. Everything is graded together at the end, then you walk through the feedback one question at a time.",
    );
  });

  it("humanises kebab-case topics, dedupes, and caps the list", () => {
    assert.equal(topicsLine(["connection-pooling", "react-hooks", "connection-pooling", "generics"]), "Covers connection pooling, react hooks and generics.");
    assert.equal(topicsLine([]), "");
    assert.equal(
      topicsLine(["a", "b", "c", "d", "e", "f", "g", "h"]),
      "Covers a, b, c, d, e, f and two more.",
    );
  });
});
