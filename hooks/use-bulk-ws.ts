// hooks/use-bulk-ws.ts
"use client";

import { useEffect, useMemo, useRef } from "react";
import { BulkWs } from "@/lib/bulk/ws";
import { useMarketsStore } from "@/stores/markets.store";
import { mapL2Book, mapTicker } from "@/domain/bulk/mappers";

export function useBulkWs() {
  const markets = useMarketsStore((s) => s.markets);
  const selectedSymbol = useMarketsStore((s) => s.selectedSymbol);

  const upsertTicker = useMarketsStore((s) => s.upsertTicker);
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
    const client = new BulkWs({
      onOpen: () => {
        // 1) global dashboard stream
        client.subscribeFrontendContext();

        // 2) subscribe tickers for ALL markets (so left list updates w/o clicking)
        for (const m of marketsRef.current) {
          client.subscribeTicker(m.symbol);
        }

        // 3) L2 only for selected
        const sel = selectedRef.current;
        if (sel) client.subscribeL2Delta(sel);
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
          upsertTicker(mapTicker(msg.symbol, msg.data));
          return;
        }

        if (msg.type === "l2book" && msg.symbol) {
          setL2(mapL2Book(msg.symbol, msg.data));
          return;
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

  // IMPORTANT: markets are often loaded AFTER WS is already open
  // so we subscribe once markets arrive too.
  useEffect(() => {
    if (!markets.length) return;
    for (const m of markets) ws.subscribeTicker(m.symbol);
  }, [ws, markets]);

  // selected L2 updates
  useEffect(() => {
    if (!selectedSymbol) return;
    ws.subscribeL2Delta(selectedSymbol);
  }, [ws, selectedSymbol]);
}
