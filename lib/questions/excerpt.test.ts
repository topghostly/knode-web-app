import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { questionExcerpt } from "./excerpt.ts";

describe("questionExcerpt", () => {
  it("takes the first prose line, strips markdown, and truncates with an ellipsis", () => {
    assert.equal(questionExcerpt("A **query** on `users` ignores its index.\n\n```sql\nSELECT 1\n```"), "A query on…");
    assert.equal(questionExcerpt("Short."), "Short.");
  });
  it("skips a leading code fence", () => {
    assert.equal(questionExcerpt("```ts\nconst a = 1\n```\nWhat does this print?"), "What does…");
  });
});
