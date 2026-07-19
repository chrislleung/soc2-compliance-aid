"use client";

import { ErrorState } from "@/components/ErrorState";

export default function Error({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <ErrorState
      message="Something went wrong loading employees."
      onRetry={unstable_retry}
    />
  );
}
