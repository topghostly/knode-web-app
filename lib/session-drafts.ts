/**
 * In-progress answers live in the browser until Submit. One record per
 * session id; every read/write is wrapped because storage can be missing,
 * full, or blocked (private mode, PWA quirks).
 */
export type SessionDraft = {
  answers: Record<string, string>;
  /** Seconds spent per question id, accumulated while the question is on screen. */
  seconds: Record<string, number>;
  /** Last viewed position (1-based) so a reload lands on the same page. */
  position: number;
};

const KEY_PREFIX = "knode:session:";

export const emptyDraft = (): SessionDraft => ({ answers: {}, seconds: {}, position: 1 });

export function draftKey(sessionId: string) {
  return `${KEY_PREFIX}${sessionId}`;
}

export function loadDraft(sessionId: string, storage: Storage | undefined = safeStorage()): SessionDraft {
  try {
    const raw = storage?.getItem(draftKey(sessionId));
    if (!raw) return emptyDraft();
    const parsed = JSON.parse(raw) as Partial<SessionDraft>;
    return {
      answers: isRecord(parsed.answers) ? parsed.answers : {},
      seconds: isRecord(parsed.seconds) ? parsed.seconds : {},
      position: typeof parsed.position === "number" && parsed.position >= 1 ? parsed.position : 1,
    };
  } catch {
    return emptyDraft();
  }
}

export function saveDraft(sessionId: string, draft: SessionDraft, storage: Storage | undefined = safeStorage()) {
  try {
    storage?.setItem(draftKey(sessionId), JSON.stringify(draft));
  } catch {
    // Quota or blocked storage: the in-memory state is still the source of truth this visit.
  }
}

export function clearDraft(sessionId: string, storage: Storage | undefined = safeStorage()) {
  try {
    storage?.removeItem(draftKey(sessionId));
  } catch {}
}

/** Ids of questions with a non-empty answer, in the given order. */
export function answeredIds(draft: SessionDraft, questionIds: string[]): string[] {
  return questionIds.filter((id) => (draft.answers[id] ?? "").trim().length > 0);
}

/** Number of questions with a non-empty answer. */
export function answeredCount(draft: SessionDraft, questionIds: string[]): number {
  return answeredIds(draft, questionIds).length;
}

function safeStorage(): Storage | undefined {
  try {
    return typeof window !== "undefined" ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

function isRecord<T>(v: unknown): v is Record<string, T> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
