"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export type AuthActionResult =
  | { ok: true }
  | { ok: false; field: "name" | "email"; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DB_UNAVAILABLE = "Couldn't reach the database. Check your connection and try again.";

export async function signUp(input: {
  firstName: string;
  lastName: string;
  email: string;
}): Promise<AuthActionResult> {

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();

  if (!firstName || !lastName || firstName.length > 100 || lastName.length > 100) {
    return { ok: false, field: "name", message: "Enter your first and last name." };
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 255) {
    return { ok: false, field: "email", message: "Enter a valid email address." };
  }

  try {
    const existing = await db.query.users.findFirst({
      columns: { id: true, emailVerified: true },
      where: eq(users.email, email),
    });

    if (existing?.emailVerified) {
      return {
        ok: false,
        field: "email",
        message: "An account with this email already exists. Sign in instead.",
      };
    }

    const name = `${firstName} ${lastName}`;
    if (existing) {
      await db.update(users).set({ firstName, lastName, name }).where(eq(users.id, existing.id));
    } else {
      await db.insert(users).values({ email, firstName, lastName, name });
    }
  } catch (error) {
    console.error("signUp: database error", error);
    return { ok: false, field: "email", message: DB_UNAVAILABLE };
  }

  return { ok: true };
}

export async function requestSignIn(input: { email: string }): Promise<AuthActionResult> {
  const email = input.email.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, field: "email", message: "Enter a valid email address." };
  }

  try {
    const existing = await db.query.users.findFirst({
      columns: { id: true },
      where: eq(users.email, email),
    });
    if (!existing) {
      return { ok: false, field: "email", message: "No account for this email. Create one below." };
    }
  } catch (error) {
    console.error("requestSignIn: database error", error);
    return { ok: false, field: "email", message: DB_UNAVAILABLE };
  }

  return { ok: true };
}
