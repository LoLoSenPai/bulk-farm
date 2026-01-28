"use client";

import { useEffect, useMemo, useRef } from "react";
import {
    CandlestickSeries,
    ColorType,
    CrosshairMode,
    LineStyle,
    createChart,
    type CandlestickData,
    type IChartApi,
    type IPriceLine,
    type ISeriesApi,
    type UTCTimestamp,
} from "lightweight-charts";
import type { Kline } from "@/domain/bulk/models";

function toCandle(k: Kline): CandlestickData<UTCTimestamp> {
    const time = Math.floor(k.t / 1000) as UTCTimestamp;
    return { time, open: k.o, high: k.h, low: k.l, close: k.c };
}

export function CandlesChart(props: { klines: Kline[]; price?: number }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const priceLineRef = useRef<IPriceLine | null>(null);
    const didFitRef = useRef(false);

    const data = useMemo(
        () => [...props.klines].sort((a, b) => a.t - b.t).map(toCandle),
        [props.klines],
    );

    useEffect(() => {
        if (!containerRef.current) return;

        const chart = createChart(containerRef.current, {
            autoSize: true,
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "rgba(255,255,255,0.70)",
                attributionLogo: false,
            },
            grid: {
                vertLines: { color: "rgba(255,255,255,0.06)" },
                horzLines: { color: "rgba(255,255,255,0.06)" },
            },
            rightPriceScale: { borderColor: "rgba(255,255,255,0.10)" },
            timeScale: {
                borderColor: "rgba(255,255,255,0.10)",
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: { mode: CrosshairMode.Normal },
        });

        const series = chart.addSeries(CandlestickSeries, {
            upColor: "rgba(255,255,255,0.92)",
            downColor: "rgba(255,255,255,0.30)",
            borderUpColor: "rgba(255,255,255,0.92)",
            borderDownColor: "rgba(255,255,255,0.30)",
            wickUpColor: "rgba(255,255,255,0.92)",
            wickDownColor: "rgba(255,255,255,0.30)",
        });

        chartRef.current = chart;
        seriesRef.current = series;

        return () => {
            if (priceLineRef.current) {
                try {
                    series.removePriceLine(priceLineRef.current);
                } catch { }
                priceLineRef.current = null;
            }
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
            didFitRef.current = false;
        };
    }, []);

    useEffect(() => {
        const chart = chartRef.current;
        const series = seriesRef.current;
        if (!chart || !series) return;

        series.setData(data);

        if (!didFitRef.current && data.length) {
            chart.timeScale().fitContent();
            didFitRef.current = true;
        }
    }, [data]);

    useEffect(() => {
        const series = seriesRef.current;
        if (!series) return;

        if (props.price === undefined) {
            if (priceLineRef.current) {
                try {
                    series.removePriceLine(priceLineRef.current);
                } catch { }
                priceLineRef.current = null;
            }
            return;
        }

        if (priceLineRef.current) {
            try {
                series.removePriceLine(priceLineRef.current);
            } catch { }
            priceLineRef.current = null;
        }

        priceLineRef.current = series.createPriceLine({
            price: props.price,
            color: "rgba(255,255,255,0.18)",
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: false,
            title: "",
        });
    }, [props.price]);

    return <div ref={containerRef} className="h-full w-full" />;
}
