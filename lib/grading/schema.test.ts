import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateGradingResponse, type GradingInput } from "./schema.ts";

const rubric = [
  { criterion: "Identifies poor selectivity", points: 4 },
  { criterion: "Explains cost comparison", points: 3 },
  { criterion: "Explains when seq scan is cheaper", points: 3 },
];

const inputs: GradingInput[] = [
  { key: "q1", answerType: "TEXT", gradingRubric: rubric, options: null, correctOption: null, userAnswer: "because…" },
  {
    key: "q2",
    answerType: "MULTIPLE_CHOICE",
    gradingRubric: [{ criterion: "Selects the stale closure option", points: 10 }],
    options: ["A", "B", "C", "D"],
    correctOption: "C",
    userAnswer: "C",
  },
];

const good = {
  evaluations: [
    { questionId: "q1", awardedPoints: [4, 2, 1], feedback: "Missed the cost model.", missingPoints: ["Cost comparison"], betterAnswer: "Postgres compares…" },
    { questionId: "q2", awardedPoints: [10], feedback: "Correct.", missingPoints: [], betterAnswer: null },
  ],
};

describe("validateGradingResponse", () => {
  it("derives score and rubricResult from awardedPoints", () => {
    const { evaluations, issues } = validateGradingResponse(good, inputs);
    assert.deepEqual(issues, []);
    assert.equal(evaluations.length, 2);
    const [q1] = evaluations;
    assert.equal(q1.key, "q1");
    assert.equal(q1.score, 7);
    assert.deepEqual(q1.rubricResult[1], { criterion: "Explains cost comparison", maxPoints: 3, awardedPoints: 2 });
  });

  it("scores multiple choice in code regardless of what the model awarded", () => {
    const wrongClick = inputs.map((i) => (i.key === "q2" ? { ...i, userAnswer: "A" } : i));
    const { evaluations } = validateGradingResponse(good, wrongClick);
    assert.equal(evaluations[1].score, 0);
    assert.deepEqual(evaluations[1].rubricResult, [{ criterion: "Selects the stale closure option", maxPoints: 10, awardedPoints: 0 }]);

    const modelSaysZero = { evaluations: good.evaluations.map((e) => (e.questionId === "q2" ? { ...e, awardedPoints: [0] } : e)) };
    const { evaluations: fixed } = validateGradingResponse(modelSaysZero, inputs);
    assert.equal(fixed[1].score, 10);
  });

  it("clears missingPoints on a full-credit answer", () => {
    const full = { evaluations: [{ ...good.evaluations[0], awardedPoints: [4, 3, 3], missingPoints: ["nitpick"] }, good.evaluations[1]] };
    const { evaluations } = validateGradingResponse(full, inputs);
    assert.deepEqual(evaluations[0].missingPoints, []);
  });

  it("fails the whole batch when a question is missing, duplicated, or unknown", () => {
    const missing = { evaluations: [good.evaluations[0]] };
    assert.equal(validateGradingResponse(missing, inputs).evaluations.length, 0);
    assert.match(validateGradingResponse(missing, inputs).issues[0], /q2/);

    const dup = { evaluations: [...good.evaluations, good.evaluations[0]] };
    assert.equal(validateGradingResponse(dup, inputs).evaluations.length, 0);

    const unknown = { evaluations: [...good.evaluations, { ...good.evaluations[0], questionId: "q9" }] };
    assert.equal(validateGradingResponse(unknown, inputs).evaluations.length, 0);
  });

  it("rejects awardedPoints that do not line up with the rubric or exceed a maximum", () => {
    const short = { evaluations: [{ ...good.evaluations[0], awardedPoints: [4, 2] }, good.evaluations[1]] };
    assert.match(validateGradingResponse(short, inputs).issues[0], /3 criteria/);

    const over = { evaluations: [{ ...good.evaluations[0], awardedPoints: [5, 2, 1] }, good.evaluations[1]] };
    assert.match(validateGradingResponse(over, inputs).issues[0], /exceeds/);

    const negative = { evaluations: [{ ...good.evaluations[0], awardedPoints: [4, -1, 1] }, good.evaluations[1]] };
    assert.equal(validateGradingResponse(negative, inputs).evaluations.length, 0);
  });

  it("reports unparseable payloads as a single issue", () => {
    const { evaluations, issues } = validateGradingResponse("nope", inputs);
    assert.equal(evaluations.length, 0);
    assert.equal(issues.length, 1);
  });
});
