import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { answeredCount, answeredIds, clearDraft, emptyDraft, loadDraft, saveDraft } from "./session-drafts.ts";

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, v),
  };
}

describe("session drafts", () => {
  it("round-trips through storage", () => {
    const s = memoryStorage();
    const draft = { answers: { q1: "because…" }, seconds: { q1: 42 }, position: 3 };
    saveDraft("abc", draft, s);
    assert.deepEqual(loadDraft("abc", s), draft);
    clearDraft("abc", s);
    assert.deepEqual(loadDraft("abc", s), emptyDraft());
  });

  it("tolerates missing storage, garbage, and partial records", () => {
    assert.deepEqual(loadDraft("abc", undefined), emptyDraft());
    const s = memoryStorage();
    s.setItem("knode:session:abc", "{not json");
    assert.deepEqual(loadDraft("abc", s), emptyDraft());
    s.setItem("knode:session:abc", JSON.stringify({ answers: { q1: "x" }, position: -4, seconds: "nope" }));
    assert.deepEqual(loadDraft("abc", s), { answers: { q1: "x" }, seconds: {}, position: 1 });
  });

  it("counts only non-blank answers for known questions", () => {
    const draft = { answers: { q1: "a", q2: "   ", q9: "stale" }, seconds: {}, position: 1 };
    assert.equal(answeredCount(draft, ["q1", "q2", "q3"]), 1);
    assert.deepEqual(answeredIds(draft, ["q3", "q1", "q2"]), ["q1"]);
  });

  it("swallows storage write failures", () => {
    const s = memoryStorage();
    s.setItem = () => {
      throw new DOMException("QuotaExceededError");
    };
    assert.doesNotThrow(() => saveDraft("abc", emptyDraft(), s));
  });
});
