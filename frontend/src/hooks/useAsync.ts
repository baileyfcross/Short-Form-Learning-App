import { useCallback, useState } from "react";

export const useAsync = <TArgs extends unknown[], TResult>(task: (...args: TArgs) => Promise<TResult>) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: TArgs) => {
      setLoading(true);
      setError(null);
      try {
        return await task(...args);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [task]
  );

  return { run, loading, error };
};
