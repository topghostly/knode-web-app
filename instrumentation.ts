import type { Instrumentation } from "next";

// Drizzle reports driver failures as "Failed query: <sql>" and hides the real
// reason in `cause`. Log the cause so a DNS timeout, a refused connection and
// a genuine SQL error are distinguishable in the server log.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const err = error as Error & { digest?: string; cause?: unknown };
  const cause = err.cause instanceof Error ? `${err.cause.name}: ${err.cause.message}` : err.cause;
  console.error(
    `[request-error] ${request.method} ${request.path} (${context.routerKind}/${context.routeType})`,
    { message: err.message, digest: err.digest, cause },
  );
};
