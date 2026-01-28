// =========================
// components/ui/card.tsx
// =========================
"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

export function Card(props: { title?: string; right?: ReactNode; className?: string; children: ReactNode }) {
    return (
        <div className={clsx("rounded-3xl border border-white/10 bg-white/[0.03] p-3 shadow-sm", props.className)}>
            {(props.title || props.right) && (
                <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-white/80">{props.title}</div>
                    <div className="flex items-center gap-2">{props.right}</div>
                </div>
            )}
            {props.children}
        </div>
    );
}

export function Pill(props: { children: ReactNode; className?: string }) {
    return (
        <span className={clsx("inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/80", props.className)}>
            {props.children}
        </span>
    );
}

export function Skeleton(props: { className?: string }) {
    return <div className={clsx("animate-pulse rounded-2xl bg-white/10", props.className)} />;
}
