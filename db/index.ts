import { setDefaultAutoSelectFamilyAttemptTimeout } from "node:net";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { withPreSendRetry } from "./retry-fetch";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Neon's host resolves to both A and AAAA records. Node races them (Happy
// Eyeballs) but allows each address only 250ms by default, which is less than
// a cold TCP handshake from outside the database's region -- every address is
// abandoned as ETIMEDOUT before the SYN-ACK lands. Widen the per-address
// budget; addresses that are genuinely unroutable still fail instantly with
// ENETUNREACH, so this costs nothing when the network is healthy.
setDefaultAutoSelectFamilyAttemptTimeout(3000);

// A slow or flaky resolver shows up as `fetch failed` on the first query after
// Neon's DNS TTL expires. Retry only failures where nothing reached Neon.
neonConfig.fetchFunction = withPreSendRetry(fetch, {
  onRetry: (code, attempt) => console.warn(`db: connection attempt ${attempt} failed (${code}); retrying`),
  onGiveUp: (codes, error) =>
    console.error(`db: giving up; codes=[${codes.join(", ")}]`, error),
});

export const db = drizzle(neon(process.env.DATABASE_URL), { schema, casing: "snake_case" });
