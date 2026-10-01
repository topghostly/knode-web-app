import { Button } from "./button";

/** Back navigation as a small secondary button with a leading chevron. */
export function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <Button href={href} variant="secondary" size="sm">
      <svg aria-hidden viewBox="0 0 16 16" className="-ml-0.5 size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </Button>
  );
}
