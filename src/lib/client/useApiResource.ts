"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiRequestError } from "@/lib/client/http";

export interface ApiResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface Result<T> {
  attempt: number;
  data: T | null;
  error: string | null;
}

export function useApiResource<T>(fetcher: () => Promise<T>): ApiResourceState<T> {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetcher()
      .then((data) => {
        if (!cancelled) setResult({ attempt, data, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Something went wrong loading this data.";
        setResult({ attempt, data: null, error: message });
      });

    return () => {
      cancelled = true;
    };
  }, [fetcher, attempt]);

  const refetch = useCallback(() => setAttempt((n) => n + 1), []);

  const settled = result !== null && result.attempt === attempt;

  return {
    data: settled ? result!.data : null,
    loading: !settled,
    error: settled ? result!.error : null,
    refetch,
  };
}
