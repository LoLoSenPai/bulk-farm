// =========================
// components/panels/chart-panel.tsx
// =========================
"use client";

import { Card, Pill, Skeleton } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { useMarketsStore } from "@/stores/markets.store";
import { CandlesChart } from "@/components/charts/candles-chart";
import { useUiStore } from "@/stores/ui.store";

export function ChartPanel() {
    const symbol = useMarketsStore((s) => s.selectedSymbol);
    const ticker = useMarketsStore((s) => (symbol ? s.tickerBySymbol[symbol] : undefined));
    const klines = useMarketsStore((s) => (symbol ? s.klinesBySymbol[symbol] : undefined));

    const interval = useUiStore((s) => s.klineInterval);
    const setInterval = useUiStore((s) => s.setKlineInterval);

    return (
        <Card
            title={symbol ? `Chart — ${symbol}` : "Chart"}
            right={
                <div className="flex items-center gap-2">
                    <IntervalSwitch value={interval} onChange={setInterval} />
                    <Tooltip
                        label={
                            <>
                                <div className="font-semibold">Mark Price</div>
                                <div className="text-white/70">
                                    Reference price used for PnL and liquidations. It follows the oracle and reduces manipulation.
                                </div>
                            </>
                        }
                    >
                        <Pill>Mark: {fmt(ticker?.mark ?? ticker?.last)}</Pill>
                    </Tooltip>

                    <Tooltip
                        label={
                            <>
                                <div className="font-semibold">Open Interest (OI)</div>
                                <div className="text-white/70">
                                    Total open positions (often expressed in base token: BTC/ETH/SOL). The higher it is, the more &quot;loaded&quot; the market is.
                                </div>
                            </>
                        }
                    >
                        <Pill>OI: {fmtOi(ticker?.openInterest, symbol)}</Pill>
                    </Tooltip>

                    <Tooltip
                        label={
                            <>
                                <div className="font-semibold">Funding Rate</div>
                                <div className="text-white/70">
                                    Periodic payment between longs and shorts. Positive = longs pay. Negative = shorts pay.
                                </div>
                            </>
                        }
                    >
                        <Pill>
                            Funding: {fmtPct(ticker?.fundingRate)}
                            <span className="ml-1 text-white/60">
                                {ticker?.fundingRate !== undefined ? (ticker.fundingRate >= 0 ? "(Longs pay)" : "(Shorts pay)") : ""}
                            </span>
                        </Pill>
                    </Tooltip>
                </div>
            }
            className="h-full"
        >
            {!symbol ? (
                <div className="text-xs text-white/60">Select a market.</div>
            ) : !klines ? (
                <div className="space-y-2">
                    <Skeleton className="h-[320px] w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
                <div className="space-y-3">
                    {!klines.length ? (
                        <div className="flex h-[400px] items-center justify-center rounded-3xl border border-white/10 bg-black/20 text-xs text-white/60">
                            No candles yet.
                        </div>
                    ) : (
                        <div className="h-[400px] overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                            <CandlesChart klines={klines} price={ticker?.mark ?? ticker?.last} />
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                        <MiniStat label="24h High" value={fmt(ticker?.high24h)} />
                        <MiniStat label="24h Low" value={fmt(ticker?.low24h)} />
                        <MiniStat label="24h Vol" value={fmtCompact(ticker?.volume24h)} />
                    </div>
                </div>
            )}
        </Card>
    );
}

function MiniStat(props: { label: string; value: string }) {
    return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-3">
            <div className="text-[11px] text-white/50">{props.label}</div>
            <div className="mt-1 text-sm font-semibold">{props.value}</div>
        </div>
    );
}

function IntervalSwitch(props: {
    value: "10s" | "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
    onChange: (v: any) => void;
}) {
    const items: Array<{ label: string; value: typeof props.value }> = [
        { label: "10s", value: "10s" },
        { label: "1m", value: "1m" },
        { label: "5m", value: "5m" },
        { label: "15m", value: "15m" },
        { label: "1h", value: "1h" },
    ];

    return (
        <div className="hidden md:flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.02] p-1">
            {items.map((it) => {
                const active = it.value === props.value;
                return (
                    <button
                        key={it.value}
                        onClick={() => props.onChange(it.value)}
                        className={
                            active
                                ? "rounded-xl bg-white px-2 py-1 text-xs font-semibold text-black"
                                : "rounded-xl px-2 py-1 text-xs text-white/70 hover:bg-white/5"
                        }
                    >
                        {it.label}
                    </button>
                );
            })}
        </div>
    );
}

function fmt(v: number | undefined, maxFrac = 2) {
    if (v === undefined) return "—";
    return v.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

function fmtPct(v: number | undefined, decimals = 4) {
    if (v === undefined) return "—";
    return `${(v * 100).toFixed(decimals)}%`;
}

function fmtOi(oi: number | undefined, symbol?: string) {
    if (oi === undefined) return "—";
    const base = symbol?.split("-")[0] ?? "";
    return base ? `${fmt(oi, 2)} ${base}` : fmt(oi, 2);
}

function fmtCompact(v: number | undefined) {
    if (v === undefined) return "—";
    return v.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 2 });
}
