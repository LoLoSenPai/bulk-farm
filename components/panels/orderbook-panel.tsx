// =========================
// components/panels/orderbook-panel.tsx
// =========================
"use client";

import { Card, Skeleton } from "@/components/ui/card";
import { useMarketsStore } from "@/stores/markets.store";

export function OrderbookPanel() {
    const symbol = useMarketsStore((s) => s.selectedSymbol);
    const book = useMarketsStore((s) => (symbol ? s.l2BySymbol[symbol] : undefined));

    return (
        <Card title="Orderbook" className="min-h-0">
            {!symbol ? (
                <div className="text-xs text-white/60">Select a market.</div>
            ) : !book ? (
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    <Side title="Bids" rows={book.bids.slice(0, 12)} />
                    <Side title="Asks" rows={book.asks.slice(0, 12)} />
                </div>
            )}
        </Card>
    );
}

function Side(props: { title: string; rows: { px: number; sz: number }[] }) {
    return (
        <div>
            <div className="mb-2 text-[11px] font-semibold text-white/60">{props.title}</div>
            <div className="space-y-1">
                {props.rows.map((r, i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
                        <span className="font-semibold">{fmt(r.px)}</span>
                        <span className="text-white/70">{fmt(r.sz)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function fmt(v: number | undefined, maxFrac = 4) {
    if (v === undefined) return "—";
    return v.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}
