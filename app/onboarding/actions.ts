"use server";

import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/db";
import { experienceLevelEnum, technologies, userTechnologies, users } from "@/db/schema";
import { MAX_TECHNOLOGIES, MIN_TECHNOLOGIES } from "@/lib/onboarding";
import { ensureReadySessions } from "@/lib/questions/ensure-ready";
import { getSession } from "@/lib/session";

type Result = { ok: true } | { ok: false; message: string };

export async function completeOnboarding(input: {
  technologyIds: string[];
  experienceLevel: string;
}): Promise<Result> {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const ids = [...new Set(input.technologyIds)];
  if (ids.length < MIN_TECHNOLOGIES || ids.length > MAX_TECHNOLOGIES) {
    return { ok: false, message: `Pick between ${MIN_TECHNOLOGIES} and ${MAX_TECHNOLOGIES} technologies.` };
  }

  const level = experienceLevelEnum.enumValues.find((v) => v === input.experienceLevel);
  if (!level) {
    return { ok: false, message: "Choose your experience level." };
  }

  const userId = session.user.id;
  try {
    const valid = await db
      .select({ id: technologies.id })
      .from(technologies)
      .where(and(inArray(technologies.id, ids), eq(technologies.isActive, true)));
    if (valid.length !== ids.length) {
      return { ok: false, message: "One of those technologies isn't available. Refresh and try again." };
    }

    await db.batch([
      db.delete(userTechnologies).where(eq(userTechnologies.userId, userId)),
      db.insert(userTechnologies).values(ids.map((technologyId) => ({ userId, technologyId }))),
      db.update(users).set({ experienceLevel: level }).where(eq(users.id, userId)),
    ]);
  } catch (error) {
    console.error("completeOnboarding: database error", error);
    return { ok: false, message: "Couldn't reach the database. Check your connection and try again." };
  }

  // Start preparing sessions now so the first "Start Session" never waits on Gemini.
  after(() => ensureReadySessions(userId));

  return { ok: true };
}
