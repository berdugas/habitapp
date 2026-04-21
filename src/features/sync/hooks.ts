import { useEffect, useState } from "react";

import { listQueuedMutations } from "@/features/sync/queue";

export function useSyncQueueStatus() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void listQueuedMutations().then((items) => {
      if (!isMounted) {
        return;
      }

      setCount(items.length);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    count,
    isLoading,
  };
}
