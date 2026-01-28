// =========================
// components/panels/farm-panel.tsx
// =========================
"use client";

import { Card, Pill } from "@/components/ui/card";
import { useAccountStore } from "@/stores/account.store";

export function FarmPanel() {
    const wallet = useAccountStore((s) => s.wallet);
    const fills = useAccountStore((s) => s.fills);
    const positions = useAccountStore((s) => s.positions);
    const loading = useAccountStore((s) => s.loading);
    const error = useAccountStore((s) => s.error);

    const volume = fills.reduce((acc, f) => acc + (f.px ?? 0) * (f.sz ?? 0), 0);
    const trades = fills.length;

    const score = wallet ? Math.round(Math.log10(1 + volume) * 100 + trades * 2) : 0;

    return (
        <Card
            title="Farm"
            right={
                <div className="flex items-center gap-2">
                    <Pill>{wallet ? "Tracking" : "Paste wallet in topbar"}</Pill>
                    {loading ? <Pill>Loading…</Pill> : null}
                </div>
            }
        >
            {error ? <div className="mb-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">{error}</div> : null}

            <div className="grid grid-cols-3 gap-2">
                <Stat label="Est. Volume" value={wallet ? fmt(volume, 2) : "—"} />
                <Stat label="Trades" value={wallet ? String(trades) : "—"} />
                <Stat label="Farm Score" value={wallet ? String(score) : "—"} />
            </div>

            <div className="mt-3 text-[11px] text-white/50">
                Score = simple placeholder (volume + activity). When Bulk reveals points formula, we swap the calc in <code className="text-white/70">domain/bulk/calculations.ts</code>.
            </div>

            <div className="mt-3">
                <div className="mb-2 text-[11px] font-semibold text-white/60">Positions</div>
                <div className="space-y-1">
                    {(positions ?? []).slice(0, 5).map((p) => (
                        <div key={p.symbol} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
                            <div className="min-w-0">
                                <div className="truncate font-semibold">{p.symbol}</div>
                                <div className="text-[11px] text-white/50">{p.side ?? "—"} • lev {fmt(p.leverage, 2)}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-semibold">{fmt(p.sz, 4)}</div>
                                <div className="text-[11px] text-white/50">size</div>
                            </div>
                        </div>
                    ))}
                    {!wallet ? <div className="text-xs text-white/60">Connect by pasting a wallet pubkey to see fills/positions.</div> : null}
                    {wallet && !positions?.length && !loading ? <div className="text-xs text-white/60">No positions found.</div> : null}
                </div>
            </div>
        </Card>
    );
}

function Stat(props: { label: string; value: string }) {
    return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-3">
            <div className="text-[11px] text-white/50">{props.label}</div>
            <div className="mt-1 text-sm font-semibold">{props.value}</div>
        </div>
    );
}

function fmt(v: number | undefined, maxFrac = 2) {
    if (v === undefined) return "—";
    return v.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}
