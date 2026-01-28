// =========================
// components/panels/trade-panel.tsx
// =========================
"use client";

import { useMemo, useState } from "react";
import { Card, Pill } from "@/components/ui/card";
import { useMarketsStore } from "@/stores/markets.store";

type ToggleProps<T extends string> = {
    value: T;
    onChange: (v: T) => void;
    a: T;
    b: T;
    className?: string;
};

export function TradePanel() {
    const symbol = useMarketsStore((s) => s.selectedSymbol);
    const ticker = useMarketsStore((s) => (symbol ? s.tickerBySymbol[symbol] : undefined));

    const [side, setSide] = useState<"long" | "short">("long");
    const [type, setType] = useState<"market" | "limit">("market");
    const [size, setSize] = useState("0.1");
    const [limitPx, setLimitPx] = useState("");

    const canSubmit = useMemo(() => !!symbol && Number(size) > 0 && (type === "market" || Number(limitPx) > 0), [symbol, size, type, limitPx]);

    return (
        <Card
            title="Trade"
            right={
                <div className="flex items-center gap-2">
                    <Pill>{symbol ?? "No market"}</Pill>
                    <Pill>Mark {fmt(ticker?.mark ?? ticker?.last)}</Pill>
                </div>
            }
            className="min-h-0"
        >
            <div className="grid grid-cols-2 gap-2">
                <Toggle<"long" | "short"> value={side} onChange={(v) => setSide(v)} a="long" b="short" />
                <Toggle<"market" | "limit"> value={type} onChange={(v) => setType(v)} a="market" b="limit" />
            </div>

            <div className="mt-2 space-y-2">
                <Field label="Size">
                    <input
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none"
                    />
                </Field>

                {type === "limit" ? (
                    <Field label="Limit price">
                        <input
                            value={limitPx}
                            onChange={(e) => setLimitPx(e.target.value)}
                            placeholder={String(ticker?.mark ?? "")}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none placeholder:text-white/40"
                        />
                    </Field>
                ) : null}

                <button
                    disabled={!canSubmit}
                    onClick={() => alert("Next step: implement signed POST /order (Sign Message + send).")}
                    className={[
                        "mt-1 w-full rounded-2xl px-3 py-2 text-sm font-semibold transition",
                        canSubmit ? "bg-white text-black hover:bg-white/90" : "cursor-not-allowed bg-white/10 text-white/40",
                    ].join(" ")}
                >
                    {side === "long" ? "Long" : "Short"} {type.toUpperCase()}
                </button>

                <div className="text-[11px] text-white/50">
                    Trade execution will be via signed <code className="text-white/70">POST /order</code> (wallet popup: Sign Message). We’ll wire it next.
                </div>
            </div>
        </Card>
    );
}

function Field(props: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="mb-1 text-[11px] font-semibold text-white/60">{props.label}</div>
            {props.children}
        </div>
    );
}

function Toggle<T extends string>({
    value,
    onChange,
    a,
    b,
    className,
}: ToggleProps<T>) {
    return (
        <div className={`grid grid-cols-2 gap-2 ${className ?? ""}`}>
            <button
                type="button"
                onClick={() => onChange(a)}
                className={`rounded-2xl border px-3 py-2 text-sm ${value === a ? "bg-white text-black border-white" : "border-white/10 bg-white/[0.02] text-white/80"
                    }`}
            >
                {a.toUpperCase()}
            </button>
            <button
                type="button"
                onClick={() => onChange(b)}
                className={`rounded-2xl border px-3 py-2 text-sm ${value === b ? "bg-white text-black border-white" : "border-white/10 bg-white/[0.02] text-white/80"
                    }`}
            >
                {b.toUpperCase()}
            </button>
        </div>
    );
}

function fmt(v: number | undefined, maxFrac = 2) {
    if (v === undefined) return "—";
    return v.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}
