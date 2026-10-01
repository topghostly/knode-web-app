import { MotionConfig } from "motion/react";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh flex-col overflow-y-auto px-6 py-10 sm:py-14">
        <div className="m-auto w-full max-w-sm">{children}</div>
      </div>
    </MotionConfig>
  );
}
