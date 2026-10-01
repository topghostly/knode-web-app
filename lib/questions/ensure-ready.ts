import "server-only";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { createReadySession } from "./create-session";

export const MAX_READY_SESSIONS = 2;

// Dedupes overlapping top-ups within one server instance (e.g. onboarding's
// after() still running when Home renders). Separate instances can still race;
// the worst case is an extra prepared batch, which is harmless.
const inFlight = new Map<string, Promise<void>>();

export async function countReadySessions(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.status, "READY")));
  return row?.n ?? 0;
}

/**
 * Tops the user up to MAX_READY_SESSIONS prepared sessions, one Gemini call
 * at a time so each batch sees the previous one in RECENT QUESTIONS. Safe to
 * call from `after()`; never throws, only logs.
 */
export function ensureReadySessions(userId: string): Promise<void> {
  const existing = inFlight.get(userId);
  if (existing) return existing;

  const run = (async () => {
    try {
      while ((await countReadySessions(userId)) < MAX_READY_SESSIONS) {
        await createReadySession(userId);
      }
    } catch (error) {
      console.error(`ensureReadySessions: failed for user ${userId}`, error);
    } finally {
      inFlight.delete(userId);
    }
  })();

  inFlight.set(userId, run);
  return run;
}
