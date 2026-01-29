// =========================
// components/panels/markets-panel.tsx
// =========================
"use client";

import { useMemo, useState } from "react";
import { Card, Pill, Skeleton } from "@/components/ui/card";
import { useMarketsStore } from "@/stores/markets.store";

export function MarketsPanel() {
    const markets = useMarketsStore((s) => s.markets);
    const selected = useMarketsStore((s) => s.selectedSymbol);
    const select = useMarketsStore((s) => s.selectSymbol);
    const tickerBySymbol = useMarketsStore((s) => s.tickerBySymbol);

    const [q, setQ] = useState("");

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();
        if (!qq) return markets;
        return markets.filter((m) => m.symbol.toLowerCase().includes(qq));
    }, [markets, q]);

    return (
        <Card
            title="Markets"
            right={
                <Pill>
                    {markets.length ? `${markets.length} symbols` : "Loading…"}
                </Pill>
            }
            className="h-full"
        >
            <div className="mb-2">
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search symbol…"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none placeholder:text-white/40"
                />
            </div>

            {!markets.length ? (
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
                <div className="max-h-[70dvh] space-y-1 overflow-auto pr-1">
                    {filtered.slice(0, 200).map((m) => {
                        const t = tickerBySymbol[m.symbol];
                        const isActive = m.symbol === selected;
                        const px = t?.last ?? t?.mark;
                        const pxLabel = t?.last !== undefined ? "last" : "mark";

                        return (
                            <button
                                key={m.symbol}
                                onClick={() => select(m.symbol)}
                                className={[
                                    "group flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-xs transition",
                                    isActive ? "border-white/20 bg-white/10" : "border-white/10 bg-white/[0.02] hover:bg-white/5",
                                ].join(" ")}
                            >
                                <div className="min-w-0">
                                    <div className="truncate font-semibold">{m.symbol}</div>
                                    <div className="truncate text-[11px] text-white/50">{m.status ?? "—"}</div>
                                </div>

                                <div className="flex items-end gap-2">
                                    <div className="text-left">
                                        <div className="flex items-baseline justify-start gap-2">
                                            <div className="font-semibold tabular-nums">
                                                {fmtPx(px, m.symbol)}
                                            </div>


                                        </div>
                                        {t?.change24hPct !== undefined ? (
                                            <div
                                                className={[
                                                    "w-[64px] text-left text-[11px] font-semibold tabular-nums",
                                                    t.change24hPct >= 0 ? "text-emerald-300" : "text-rose-300",
                                                ].join(" ")}
                                            >
                                                {(t.change24hPct * 100).toFixed(2)}%
                                            </div>
                                        ) : null}

                                    </div>
                                    <div className="hidden w-[80px] text-right md:block">
                                        <div className="font-semibold">{fmtPct(t?.fundingRate)}</div>
                                        <div className="text-[11px] text-white/50">funding</div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}

function decimalsForSymbol(symbol?: string) {
    const base = symbol?.split("-")[0];
    if (base === "BTC") return 2;
    if (base === "ETH") return 2;
    if (base === "SOL") return 2;
    return 2;
}

function fmtPx(v: number | undefined, symbol?: string) {
    if (v === undefined) return "—";
    const d = decimalsForSymbol(symbol);
    // pas de séparateur de milliers + décimales fixes
    return v.toLocaleString("en-US", {
        useGrouping: false,
        minimumFractionDigits: d,
        maximumFractionDigits: d,
    });
}


function fmtPct(v: number | undefined, decimals = 4) {
    if (v === undefined) return "—";
    return `${(v * 100).toFixed(decimals)}%`;
}