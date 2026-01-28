// =========================
// components/shell/app-shell.tsx
// =========================
"use client";

import type { ReactNode } from "react";

export function AppShell(props: { left: ReactNode; center: ReactNode; right: ReactNode }) {
    return (
        <div className="mx-auto w-full max-w-[1600px] px-3 pb-6 pt-3">
            <div className="grid gap-3 lg:grid-cols-[340px_minmax(0,1fr)_380px]">
                <section className="min-h-[70dvh]">{props.left}</section>
                <section className="min-h-[70dvh]">{props.center}</section>
                <section className="min-h-[70dvh]">{props.right}</section>
            </div>

            {/* Mobile: stack panels */}
            <div className="mt-3 grid gap-3 lg:hidden">
                {/* You can replace this with bottom tabs later */}
            </div>
        </div>
    );
}
