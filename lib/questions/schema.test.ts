import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateGeneratedQuestions } from "./schema.ts";

const slugs = ["postgresql", "typescript", "react"];

const text = {
  technology: "postgresql",
  topic: "query-planning",
  cognitiveTask: "explain",
  answerType: "TEXT",
  questionText:
    "A query filtering on an indexed boolean column ignores the index and does a sequential scan. Explain why the planner might make that choice.",
  gradingRubric: [
    { criterion: "Identifies poor selectivity as the reason", points: 4 },
    { criterion: "Explains the planner's cost comparison", points: 3 },
    { criterion: "Explains when a sequential scan may be cheaper", points: 3 },
  ],
  options: null,
  correctOptionIndex: null,
  codeLanguage: null,
};

const code = {
  ...text,
  technology: "typescript",
  topic: "type-narrowing",
  cognitiveTask: "implement",
  answerType: "CODE",
  codeLanguage: "TypeScript",
};

const mc = {
  ...text,
  technology: "react",
  topic: "rendering",
  cognitiveTask: "predict",
  answerType: "MULTIPLE_CHOICE",
  gradingRubric: [{ criterion: "Selects the option describing a stale closure", points: 10 }],
  options: ["A", "B", "C", "D"],
  correctOptionIndex: 2,
};

describe("validateGeneratedQuestions", () => {
  it("accepts a well-formed session and resolves the correct option text", () => {
    const { questions, issues } = validateGeneratedQuestions({ questions: [text, code, mc] }, { slugs });
    assert.deepEqual(issues, []);
    assert.equal(questions.length, 3);
    assert.equal(questions[1].codeLanguage, "typescript");
    assert.equal(questions[2].answerType, "MULTIPLE_CHOICE");
    assert.equal(questions[2].correctOption, "C");
  });

  it("drops only the failing question and reports why", () => {
    const bad = { ...text, gradingRubric: [{ criterion: "x", points: 5 }, { criterion: "y", points: 4 }] };
    const { questions, issues } = validateGeneratedQuestions({ questions: [text, bad, mc] }, { slugs });
    assert.equal(questions.length, 2);
    assert.equal(issues.length, 1);
    assert.match(issues[0], /question 2/);
    assert.match(issues[0], /sum to 10/);
  });

  it("rejects an unknown technology slug", () => {
    const { questions, issues } = validateGeneratedQuestions({ questions: [{ ...text, technology: "rust" }] }, { slugs });
    assert.equal(questions.length, 0);
    assert.match(issues[0], /technology/);
  });

  it("rejects a rubric whose largest criterion is under 4 points", () => {
    const flat = {
      ...text,
      gradingRubric: [
        { criterion: "a", points: 3 },
        { criterion: "b", points: 3 },
        { criterion: "c", points: 2 },
        { criterion: "d", points: 2 },
      ],
    };
    const { questions, issues } = validateGeneratedQuestions({ questions: [flat] }, { slugs });
    assert.equal(questions.length, 0);
    assert.match(issues[0], /at least 4/);
  });

  it("rejects CODE without a language", () => {
    const { questions } = validateGeneratedQuestions({ questions: [{ ...code, codeLanguage: null }] }, { slugs });
    assert.equal(questions.length, 0);
  });

  it("rejects MULTIPLE_CHOICE with the wrong option count, duplicate options, or a bad index", () => {
    const cases = [
      { ...mc, options: ["A", "B", "C"] },
      { ...mc, options: ["A", "A", "C", "D"] },
      { ...mc, correctOptionIndex: 4 },
      { ...mc, correctOptionIndex: null },
    ];
    for (const q of cases) {
      const { questions } = validateGeneratedQuestions({ questions: [q] }, { slugs });
      assert.equal(questions.length, 0, JSON.stringify(q));
    }
  });

  it("nulls out fields that do not belong to the answer type instead of failing", () => {
    const { questions } = validateGeneratedQuestions(
      { questions: [{ ...text, codeLanguage: "sql", options: ["A", "B", "C", "D"], correctOptionIndex: 0 }] },
      { slugs },
    );
    assert.equal(questions.length, 1);
    assert.equal(questions[0].codeLanguage, null);
    assert.equal(questions[0].options, null);
    assert.equal(questions[0].correctOption, null);
  });

  it("normalises topics to kebab-case", () => {
    const { questions } = validateGeneratedQuestions({ questions: [{ ...text, topic: "Query Planning " }] }, { slugs });
    assert.equal(questions[0].topic, "query-planning");
  });

  it("reports unparseable payloads as a single issue", () => {
    const { questions, issues } = validateGeneratedQuestions({ nope: true }, { slugs });
    assert.equal(questions.length, 0);
    assert.equal(issues.length, 1);
  });
});
