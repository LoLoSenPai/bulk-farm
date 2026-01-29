"use client";

import { useEffect } from "react";
import { useMarketsStore } from "@/stores/markets.store";
import { getTicker } from "@/lib/bulk/endpoints";

export function useBulkTickerPollSelected(intervalMs = 20_000) {
  const symbol = useMarketsStore((s) => s.selectedSymbol);
  const upsertTicker = useMarketsStore((s) => s.upsertTicker);

  useEffect(() => {
    if (!symbol) return;

    let alive = true;

    const tick = async () => {
      try {
        const t = await getTicker(symbol);
        if (!alive) return;
        upsertTicker(t);
      } catch {}
    };

    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [symbol, upsertTicker, intervalMs]);
}
