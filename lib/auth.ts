import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { accounts, authSessions, users, verifications } from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: users, session: authSessions, account: accounts, verification: verifications },
  }),
  advanced: { database: { generateId: "uuid" } },
  session: { cookieCache: { enabled: true, maxAge: 60 } },
  user: {
    fields: { image: "imageUrl" },
    additionalFields: {
      firstName: { type: "string", required: true },
      lastName: { type: "string", required: true },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      mapProfileToUser: (profile) => ({
        firstName: profile.given_name,
        lastName: profile.family_name,
      }),
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
