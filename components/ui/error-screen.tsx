"use client";

import { useEffect } from "react";
import { Button } from "./button";
import { Screen } from "./screen";

/**
 * Calm fallback for a failed render. Server errors reach the client redacted
 * (message + digest only), so the copy stays general and the digest is shown
 * small for support.
 */
export function ErrorScreen({
  error,
  retry,
  withNav = true,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  withNav?: boolean;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Screen withNav={withNav}>
      <main className="flex flex-1 flex-col justify-center">
        <h1 className="font-display text-[2rem] font-medium leading-[1.08] tracking-tight text-balance">
          That didn&rsquo;t load.
        </h1>
        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ink/70">
          Usually a connection hiccup between here and the database. Nothing you entered is lost.
        </p>
        <Button onClick={retry} className="mt-8 self-start">
          Try again
        </Button>
        {error.digest && <p className="mt-6 font-mono text-[11px] text-ink/35">Ref {error.digest}</p>}
      </main>
    </Screen>
  );
}
