import type { ReactNode } from "react";

/**
 * Full-height app screen: safe-area padding, a contained column, and enough
 * bottom clearance for the floating nav. `withNav={false}` for workflow
 * screens (session, results) that don't show the nav.
 */
export function Screen({ children, withNav = true }: { children: ReactNode; withNav?: boolean }) {
  return (
    <div
      className={`flex h-dvh flex-col overflow-y-auto px-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8 ${
        withNav
          ? "pb-[calc(env(safe-area-inset-bottom)+5.75rem)] sm:pb-[calc(env(safe-area-inset-bottom)+6.5rem)]"
          : "pb-[max(1.75rem,env(safe-area-inset-bottom))]"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[75rem] flex-1 flex-col">{children}</div>
    </div>
  );
}
