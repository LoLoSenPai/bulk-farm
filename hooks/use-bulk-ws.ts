// hooks/use-bulk-ws.ts
"use client";

import { useEffect, useMemo, useRef } from "react";
import { BulkWs } from "@/lib/bulk/ws";
import { useMarketsStore } from "@/stores/markets.store";
import { mapL2Book, mapTicker } from "@/domain/bulk/mappers";

export function useBulkWs() {
  const selectedSymbol = useMarketsStore((s) => s.selectedSymbol);
  const markets = useMarketsStore((s) => s.markets);
  const upsertTicker = useMarketsStore((s) => s.upsertTicker);
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
        // Re-subscribe on every (re)connect
        const ms = marketsRef.current;
        for (const m of ms) {
          ws.subscribeTicker(m.symbol);
        }
        const sel = selectedRef.current;
        if (sel) ws.subscribeL2Book(sel);
      },
      onMessage: (msg) => {
        if (msg.type === "ticker" && msg.symbol) {
          upsertTicker(mapTicker(msg.symbol, msg.data));
        }
        if (msg.type === "l2book" && msg.symbol) {
          setL2(mapL2Book(msg.symbol, msg.data));
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // keep one WS instance

  useEffect(() => {
    ws.connect();
    return () => ws.close();
  }, [ws]);

  // Subscribe tickers for ALL markets (initial + when markets list changes)
  useEffect(() => {
    if (!markets.length) return;
    for (const m of markets) ws.subscribeTicker(m.symbol);
  }, [ws, markets]);

  // Subscribe L2 only for selected (when selection changes)
  useEffect(() => {
    if (!selectedSymbol) return;
    ws.subscribeL2Book(selectedSymbol);
  }, [ws, selectedSymbol]);
}
