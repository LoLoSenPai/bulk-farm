// =========================
// hooks/use-bulk-bootstrap.ts
// =========================
"use client";

import { useEffect } from "react";
import {
  getExchangeInfo,
  getTicker,
  getKlines,
  getL2Book,
  postAccount,
} from "@/lib/bulk/endpoints";
import { useMarketsStore } from "@/stores/markets.store";
import { useAccountStore } from "@/stores/account.store";
import { useUiStore } from "@/stores/ui.store";

export function useBulkBootstrap() {
  const selectedSymbol = useMarketsStore((s) => s.selectedSymbol);
  const wallet = useAccountStore((s) => s.wallet);
  const interval = useUiStore((s) => s.klineInterval);

  // 1) boot: load markets + init tickers + pick first symbol
  useEffect(() => {
    let alive = true;

    (async () => {
      const markets = await getExchangeInfo();
      if (!alive) return;

      const { setMarkets, selectSymbol, upsertTicker } =
        useMarketsStore.getState();

      setMarkets(markets);

      // init tickers once
      for (const m of markets) {
        getTicker(m.symbol)
          .then((t) => alive && upsertTicker(t))
          .catch((e) => console.warn("Ticker init failed:", m.symbol, e));
      }

      const first = markets[0]?.symbol;
      if (first) selectSymbol(first);
    })();

    return () => {
      alive = false;
    };
  }, []);

  // 2) when selectedSymbol changes: load snapshot for center/right panels
  useEffect(() => {
    if (!selectedSymbol) return;

    let alive = true;

    (async () => {
      const { upsertTicker, setL2, setKlines } = useMarketsStore.getState();

      const results = await Promise.allSettled([
        getTicker(selectedSymbol),
        getL2Book({ symbol: selectedSymbol, limit: 50 }),
        getKlines({ symbol: selectedSymbol, interval, limit: 240 }),
      ]);

      if (!alive) return;

      const [t, book, k] = results;

      if (t.status === "fulfilled") upsertTicker(t.value);

      if (book.status === "fulfilled") setL2(book.value);
      else console.warn("L2Book failed:", book.reason);

      if (k.status === "fulfilled") setKlines(selectedSymbol, k.value);
      else console.warn("Klines failed:", k.reason);
    })();

    return () => {
      alive = false;
    };
  }, [selectedSymbol, interval]);

  // 3) when wallet changes: load account data
  useEffect(() => {
    if (!wallet) return;

    let alive = true;

    (async () => {
      const { setAccountData, setLoading, setError } =
        useAccountStore.getState();

      try {
        setLoading(true);
        setError(undefined);

        const [fills, positions] = await Promise.all([
          postAccount({ wallet, request: "fills", limit: 500 }),
          postAccount({ wallet, request: "positions", limit: 100 }),
        ]);

        if (!alive) return;
        setAccountData({ fills: fills.fills, positions: positions.positions });
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load account");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [wallet]);
}
