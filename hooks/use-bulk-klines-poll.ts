"use client";

import { useEffect } from "react";
import { getKlines } from "@/lib/bulk/endpoints";
import { useMarketsStore } from "@/stores/markets.store";
import { useUiStore } from "@/stores/ui.store";

export function useBulkKlinesPoll(intervalMs = 5000) {
  const symbol = useMarketsStore((s) => s.selectedSymbol);
  const setKlines = useMarketsStore((s) => s.setKlines);
  const interval = useUiStore((s) => s.klineInterval);

  useEffect(() => {
    if (!symbol) return;

    let alive = true;

    const tick = async () => {
      try {
        const k = await getKlines({ symbol, interval, limit: 240 });
        if (!alive) return;
        setKlines(symbol, k);
      } catch {}
    };

    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [symbol, interval, intervalMs, setKlines]);
}
