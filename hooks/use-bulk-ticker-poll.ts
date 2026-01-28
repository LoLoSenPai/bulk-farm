"use client";

import { useEffect } from "react";
import { useMarketsStore } from "@/stores/markets.store";
import { getTicker } from "@/lib/bulk/endpoints";

export function useBulkTickerPoll(intervalMs = 2000) {
  const markets = useMarketsStore((s) => s.markets);
  const upsertTicker = useMarketsStore((s) => s.upsertTicker);

  useEffect(() => {
    if (!markets.length) return;

    let alive = true;
    const tick = async () => {
      for (const m of markets) {
        try {
          const t = await getTicker(m.symbol);
          if (!alive) return;
          upsertTicker(t);
        } catch {}
      }
    };

    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [markets, upsertTicker, intervalMs]);
}
