// hooks/use-bulk-ws.ts
"use client";

import { useEffect, useMemo, useRef } from "react";
import { BulkWs } from "@/lib/bulk/ws";
import { useMarketsStore } from "@/stores/markets.store";
import { mapL2Book, mapTicker } from "@/domain/bulk/mappers";

export function useBulkWs() {
  const selectedSymbol = useMarketsStore((s) => s.selectedSymbol);
  const upsertTickers = useMarketsStore((s) => s.upsertTickers);
  const upsertTicker = useMarketsStore((s) => s.upsertTicker);
  const setL2 = useMarketsStore((s) => s.setL2);

  const selectedRef = useRef<string | undefined>(selectedSymbol);
  const prevSelectedRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    selectedRef.current = selectedSymbol;
  }, [selectedSymbol]);

  const ws = useMemo(() => {
    const client = new BulkWs({
      onOpen: () => {
        client.subscribeFrontendContext();

        const sel = selectedRef.current;
        if (sel) {
          client.subscribeTicker(sel); // ✅ mark live sur selected
          client.subscribeL2Delta(sel); // ✅ book live sur selected
        }
      },

      onMessage: (msg) => {
        if (msg.type === "frontendContext") {
          const rows = msg.data?.ctx ?? msg.data?.data?.ctx ?? [];
          const tickers = rows
            .map((row: any) =>
              row?.symbol ? mapTicker(row.symbol, row) : null,
            )
            .filter(Boolean) as any[];

          if (tickers.length) upsertTickers(tickers);
          return;
        }

        if (msg.type === "ticker" && msg.symbol) {
          // ticker stream (200ms) => contient markPrice, high/low/volume, etc.
          upsertTicker(mapTicker(msg.symbol, msg.data));
          return;
        }

        if (msg.type === "l2book" && msg.symbol) {
          setL2(mapL2Book(msg.symbol, msg.data));
        }
      },
    });

    return client;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    ws.connect();
    return () => ws.close();
  }, [ws]);

  // (un)subscribe selected streams proprement
  useEffect(() => {
    const prev = prevSelectedRef.current;
    const next = selectedSymbol;

    if (prev && prev !== next) {
      ws.unsubscribeTicker(prev);
      ws.unsubscribeL2Delta(prev);
    }

    if (next) {
      ws.subscribeTicker(next);
      ws.subscribeL2Delta(next);
    }

    prevSelectedRef.current = next;
  }, [ws, selectedSymbol]);
}
