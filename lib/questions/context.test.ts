import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildGenerationContents } from "./context.ts";

describe("buildGenerationContents", () => {
  it("lists technologies, says when there is no history, and states the count", () => {
    const out = buildGenerationContents({
      technologies: [{ slug: "react", name: "React" }],
      recentQuestions: [],
      experienceLevel: "SENIOR",
    });
    assert.match(out, /- react \(React\)/);
    assert.match(out, /None yet/);
    assert.match(out, /questions: 10/);
    assert.match(out, /experience level: SENIOR/);
  });

  it("excerpts long recent questions and caps the list at 20", () => {
    const long = "x".repeat(500);
    const out = buildGenerationContents({
      technologies: [{ slug: "react", name: "React" }],
      recentQuestions: Array.from({ length: 25 }, (_, i) => ({
        technology: "react",
        topic: `t${i}`,
        questionText: long,
      })),
      experienceLevel: null,
      count: 5,
    });
    assert.match(out, /20\. \[react \/ t19\]/);
    assert.doesNotMatch(out, /21\. /);
    assert.doesNotMatch(out, /x{200}/);
    assert.match(out, /questions: 5/);
    assert.match(out, /unspecified/);
  });
});
