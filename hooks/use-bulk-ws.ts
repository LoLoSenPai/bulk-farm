"use client";

import { useEffect, useMemo, useRef } from "react";
import { BulkWs } from "@/lib/bulk/ws";
import { useMarketsStore } from "@/stores/markets.store";
import { mapL2Book, mapTicker } from "@/domain/bulk/mappers";

export function useBulkWs() {
  const selectedSymbol = useMarketsStore((s) => s.selectedSymbol);
  const upsertTickers = useMarketsStore((s) => s.upsertTickers);
  const setL2 = useMarketsStore((s) => s.setL2);

  const selectedRef = useRef(selectedSymbol);

  useEffect(() => {
    selectedRef.current = selectedSymbol;
  }, [selectedSymbol]);

  const ws = useMemo(() => {
    return new BulkWs({
      onOpen: () => {
        // One subscription feeds all tickers
        ws.subscribeFrontendContext();

        // L2 only for selected
        const sel = selectedRef.current;
        if (sel) ws.subscribeL2Book(sel);
      },
      onMessage: (msg) => {
        if (msg.type === "frontendContext") {
          const rows = msg.data?.ctx ?? msg.data?.data?.ctx ?? [];
          const tickers = rows
            .map((row: any) => {
              if (!row?.symbol) return null;
              return mapTicker(row.symbol, row);
            })
            .filter(Boolean) as any[];

          if (tickers.length) upsertTickers(tickers);
          return;
        }

        if (msg.type === "l2book" && msg.symbol) {
          setL2(mapL2Book(msg.symbol, msg.data));
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    ws.connect();
    return () => ws.close();
  }, [ws]);

  useEffect(() => {
    if (!selectedSymbol) return;
    ws.subscribeL2Book(selectedSymbol);
  }, [ws, selectedSymbol]);
}
