"use client";

import { AppShell } from "@/components/shell/app-shell";
import { Topbar } from "@/components/shell/topbar";
import { MarketsPanel } from "@/components/panels/markets-panel";
import { ChartPanel } from "@/components/panels/chart-panel";
import { OrderbookPanel } from "@/components/panels/orderbook-panel";
import { FarmPanel } from "@/components/panels/farm-panel";
import { TradePanel } from "@/components/panels/trade-panel";
import { useBulkBootstrap } from "@/hooks/use-bulk-bootstrap";
import { useBulkWs } from "@/hooks/use-bulk-ws";
import { useBulkTickerPollSelected } from "@/hooks/use-bulk-ticker-poll";
import { useBulkKlinesPoll } from "@/hooks/use-bulk-klines-poll";

export default function AppClient() {
    useBulkBootstrap();
    useBulkWs();
    useBulkTickerPollSelected(30_000);
    useBulkKlinesPoll();

    return (
        <div className="min-h-dvh">
            <Topbar />
            <AppShell
                left={<MarketsPanel />}
                center={<ChartPanel />}
                right={
                    <div className="flex h-full flex-col gap-3">
                        <FarmPanel />
                        <div className="grid min-h-0 flex-1 grid-rows-2 gap-3">
                            <OrderbookPanel />
                            <TradePanel />
                        </div>
                    </div>
                }
            />
        </div>
    );
}
