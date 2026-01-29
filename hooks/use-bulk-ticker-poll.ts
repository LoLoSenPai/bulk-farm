"use client";

import { useEffect } from "react";
import { useMarketsStore } from "@/stores/markets.store";
import { getTicker } from "@/lib/bulk/endpoints";

// refresh lent pour récupérer les champs que le WS ne donne pas (high/low/quoteVolume...)
export function useBulkTickerPoll(intervalMs = 60_000) {
  const markets = useMarketsStore((s) => s.markets);
  const upsertTicker = useMarketsStore((s) => s.upsertTicker);

  useEffect(() => {
    if (!markets.length) return;

    let alive = true;

    const tick = async () => {
      // fetch en parallèle (plus rapide)
      const ps = markets.map((m) =>
        getTicker(m.symbol)
          .then((t) => ({ ok: true as const, t }))
          .catch(() => ({ ok: false as const })),
      );

      const res = await Promise.all(ps);
      if (!alive) return;

      for (const r of res) {
        if (r.ok) upsertTicker(r.t);
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
