"use client";

import { ErrorScreen } from "@/components/ui/error-screen";

export default function AppError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorScreen error={props.error} retry={props.retry} />;
}
