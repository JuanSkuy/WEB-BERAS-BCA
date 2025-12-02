import { useEffect, useRef, useState } from "react";

interface UseAutoRefreshOptions {
  interval?: number; // dalam milliseconds, default 30000 (30 detik)
  enabled?: boolean; // untuk enable/disable auto refresh
  onRefresh?: () => void | Promise<void>;
}

export function useAutoRefresh({
  interval = 30000,
  enabled = true,
  onRefresh,
}: UseAutoRefreshOptions = {}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onRefreshRef = useRef(onRefresh);

  // Update ref ketika onRefresh berubah
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled || !onRefresh) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Refresh pertama kali
    const refresh = async () => {
      setIsRefreshing(true);
      try {
        await onRefreshRef.current?.();
      } catch (error) {
        console.error("Auto refresh error:", error);
      } finally {
        setIsRefreshing(false);
      }
    };

    // Setup interval
    intervalRef.current = setInterval(refresh, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [interval, enabled, onRefresh]);

  // Manual refresh function
  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshRef.current?.();
    } catch (error) {
      console.error("Manual refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    isRefreshing,
    refresh,
  };
}

