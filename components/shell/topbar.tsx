// =========================
// components/shell/topbar.tsx
// =========================
"use client";

import { useAccountStore } from "@/stores/account.store";
import Image from "next/image";

export function Topbar() {
    const wallet = useAccountStore((s) => s.wallet);

    return (
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-3 py-2">
                <div className="flex items-center gap-3">
                    <Image src="/logo.svg" alt="Bulk" width={36} height={36} />
                    <div className="leading-tight">
                        <div className="text-sm font-semibold">Bulk Terminal</div>
                        <div className="text-xs text-white/60">Markets • Farm • Perps</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <WalletInput />
                    <div className="hidden text-xs text-white/50 md:block">{wallet ? `Tracking: ${short(wallet)}` : "No wallet"}</div>
                </div>
            </div>
        </header>
    );
}

function WalletInput() {
    const wallet = useAccountStore((s) => s.wallet);
    const setWallet = useAccountStore((s) => s.setWallet);

    return (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <input
                value={wallet ?? ""}
                onChange={(e) => setWallet(e.target.value.trim() || undefined)}
                placeholder="Paste wallet pubkey (optional)"
                className="w-[220px] bg-transparent text-xs outline-none placeholder:text-white/40"
            />
            {wallet ? (
                <button
                    onClick={() => setWallet(undefined)}
                    className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                >
                    Clear
                </button>
            ) : null}
        </div>
    );
}

function short(s: string) {
    return s.length > 12 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}
