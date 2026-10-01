// Errors raised before a request reaches Neon: DNS lookup failed or timed
// out, or the TCP/TLS connection couldn't be made. Retrying these can't
// duplicate a write because nothing was sent. Anything else (socket dropped
// mid-flight, HTTP errors, SQL errors) is surfaced as-is.
const PRE_SEND_ERROR_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ETIMEDOUT",
  "UND_ERR_CONNECT_TIMEOUT",
]);

export const RETRY_DELAYS_MS = [250, 1000];

// Every code seen on the cause chain, retryable or not. Diagnostic only.
export function errorCodes(error: unknown): string[] {
  const cause = error instanceof Error ? error.cause : undefined;
  if (!cause || typeof cause !== "object") return [];
  const candidates = "errors" in cause && Array.isArray(cause.errors) ? cause.errors : [cause];
  return candidates
    .map((c) => (c && typeof c === "object" && "code" in c ? String(c.code) : null))
    .filter((c): c is string => c !== null);
}

export function preSendErrorCode(error: unknown): string | null {
  const cause = error instanceof Error ? error.cause : undefined;
  if (!cause || typeof cause !== "object") return null;
  // Node's fetch wraps a single error or an AggregateError of per-address attempts.
  const candidates = "errors" in cause && Array.isArray(cause.errors) ? cause.errors : [cause];
  for (const c of candidates) {
    const code = c && typeof c === "object" && "code" in c ? String(c.code) : null;
    if (code && PRE_SEND_ERROR_CODES.has(code)) return code;
  }
  return null;
}

export function withPreSendRetry(
  baseFetch: typeof fetch,
  options: {
    delays?: number[];
    sleep?: (ms: number) => Promise<void>;
    onRetry?: (code: string, attempt: number) => void;
    onGiveUp?: (codes: string[], error: unknown) => void;
  } = {},
): typeof fetch {
  const delays = options.delays ?? RETRY_DELAYS_MS;
  const sleep = options.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  return async (input, init) => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await baseFetch(input, init);
      } catch (error) {
        const code = preSendErrorCode(error);
        if (!code || attempt >= delays.length) {
          options.onGiveUp?.(errorCodes(error), error);
          throw error;
        }
        options.onRetry?.(code, attempt + 1);
        await sleep(delays[attempt]);
      }
    }
  };
}
