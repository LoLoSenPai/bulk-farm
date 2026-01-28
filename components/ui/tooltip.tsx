"use client";

import type { ReactNode } from "react";

export function Tooltip(props: { label: ReactNode; children: ReactNode }) {
    return (
        <span className="group relative inline-flex items-center gap-1">
            {props.children}
            <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-[260px] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/90 px-3 py-2 text-[11px] text-white/80 opacity-0 shadow-lg backdrop-blur transition group-hover:opacity-100">
                {props.label}
            </span>
        </span>
    );
}
