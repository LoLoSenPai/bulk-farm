// hooks/use-bulk-ws.ts
"use client";

import { useEffect, useMemo, useRef } from "react";
import { BulkWs } from "@/lib/bulk/ws";
import { useMarketsStore } from "@/stores/markets.store";
import { mapL2Book, mapTicker } from "@/domain/bulk/mappers";

function extractTickersFromFrontendContext(ctx: any) {
  // Heuristiques: on ne connaît pas 100% la shape, donc on supporte plusieurs formes.
  // 1) ctx.tickers: Array<{symbol,...}>
  if (ctx?.tickers && Array.isArray(ctx.tickers)) return ctx.tickers;

  // 2) ctx is already an array
  if (Array.isArray(ctx)) return ctx;

  // 3) ctx.markets: Array
  if (ctx?.markets && Array.isArray(ctx.markets)) return ctx.markets;

  // 4) ctx.bySymbol: { [symbol]: {...} }
  if (ctx?.bySymbol && typeof ctx.bySymbol === "object") {
    return Object.entries(ctx.bySymbol).map(([symbol, data]) => ({
      symbol,
      ...(data as any),
    }));
  }

  return [];
}

export function useBulkWs() {
  const selectedSymbol = useMarketsStore((s) => s.selectedSymbol);
  const markets = useMarketsStore((s) => s.markets);

  const upsertTickers = useMarketsStore((s) => s.upsertTickers);
  const setL2 = useMarketsStore((s) => s.setL2);

  const marketsRef = useRef(markets);
  const selectedRef = useRef(selectedSymbol);

  useEffect(() => {
    marketsRef.current = markets;
  }, [markets]);

  useEffect(() => {
    selectedRef.current = selectedSymbol;
  }, [selectedSymbol]);

  const ws = useMemo(() => {
    return new BulkWs({
      onOpen: () => {
        // 1) subscribe batch tickers
        ws.subscribeFrontendContext();

        // 2) l2 for selected
        const sel = selectedRef.current;
        if (sel) ws.subscribeL2Book(sel);
      },
      onMessage: (msg) => {
        if (msg.type === "frontendContext") {
          const rows = extractTickersFromFrontendContext(msg.data);

          // Map -> Ticker domain
          const tickers = rows
            .map((row: any) => {
              const symbol = row.symbol ?? row.s;
              if (!symbol) return null;
              return mapTicker(symbol, row);
            })
            .filter(Boolean) as any[];

          if (tickers.length) upsertTickers(tickers);
          return;
        }

        if (msg.type === "l2book" && msg.symbol) {
          setL2(mapL2Book(msg.symbol, msg.data));
        }

        // (tu peux garder "ticker" si Bulk l’envoie encore, mais normalement plus nécessaire)
        if (msg.type === "ticker" && msg.symbol) {
          upsertTickers([mapTicker(msg.symbol, msg.data)] as any);
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // keep one WS instance

  useEffect(() => {
    ws.connect();
    return () => ws.close();
  }, [ws]);

  // Subscribe L2 only for selected (when selection changes)
  useEffect(() => {
    if (!selectedSymbol) return;
    ws.subscribeL2Book(selectedSymbol);
  }, [ws, selectedSymbol]);
}
