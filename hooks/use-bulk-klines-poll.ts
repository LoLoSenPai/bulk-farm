"use client";

import { useEffect, useRef } from "react";
import { getKlines } from "@/lib/bulk/endpoints";
import { useMarketsStore } from "@/stores/markets.store";
import { useUiStore } from "@/stores/ui.store";
import type { Kline } from "@/domain/bulk/models";

type CacheEntry = { ts: number; data: Kline[] };

export function useBulkKlinesPoll(intervalMs = 5000) {
  const symbol = useMarketsStore((s) => s.selectedSymbol);
  const setKlines = useMarketsStore((s) => s.setKlines);
  const interval = useUiStore((s) => s.klineInterval);

  const cacheRef = useRef(new Map<string, CacheEntry>());

  useEffect(() => {
    if (!symbol) return;

    let alive = true;
    const key = `${symbol}|${interval}|240`;

    const tick = async () => {
      // cache soft: si on a moins de 2s, on évite un refetch (anti-spam switch)
      const cached = cacheRef.current.get(key);
      if (cached && Date.now() - cached.ts < 2000) {
        setKlines(symbol, cached.data);
        return;
      }

      try {
        const k = await getKlines({ symbol, interval, limit: 240 });
        if (!alive) return;
        cacheRef.current.set(key, { ts: Date.now(), data: k });
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
