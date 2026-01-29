// =========================
// lib/bulk/endpoints.ts
// =========================
import { bulkFetch } from "./http";
import {
  mapKlines,
  mapL2Book,
  mapMarket,
  mapTicker,
  mapFills,
  mapPositions,
} from "@/domain/bulk/mappers";
import type {
  Kline,
  Market,
  Ticker,
  Fill,
  Position,
} from "@/domain/bulk/models";

export async function getExchangeInfo(): Promise<Market[]> {
  const raw = await bulkFetch<any>("/exchangeInfo");
  const markets = raw?.symbols ?? raw?.markets ?? raw ?? [];
  return (markets ?? []).map(mapMarket).filter((m: Market) => m.symbol);
}

export async function getTicker(symbol: string): Promise<Ticker> {
  const raw = await bulkFetch<any>(`/ticker/${encodeURIComponent(symbol)}`);
  return mapTicker(symbol, raw);
}

export async function getKlines(params: {
  symbol: string;
  interval: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}): Promise<Kline[]> {
  const usp = new URLSearchParams();
  usp.set("symbol", params.symbol);
  usp.set("interval", params.interval);
  if (params.startTime) usp.set("startTime", String(params.startTime));
  if (params.endTime) usp.set("endTime", String(params.endTime));
  if (params.limit) usp.set("limit", String(params.limit));
  const raw = await bulkFetch<any>(`/klines?${usp.toString()}`);
  const arr = raw?.klines ?? raw?.data ?? raw ?? [];
  const out = mapKlines(arr);
  return params.limit ? out.slice(-params.limit) : out;
}

export async function getL2Book(params: {
  symbol: string;
  limit?: number;
  grouping?: number;
}) {
  const usp = new URLSearchParams();
  usp.set("symbol", params.symbol);
  if (params.limit) usp.set("limit", String(params.limit));
  if (params.grouping) usp.set("grouping", String(params.grouping));
  const raw = await bulkFetch<any>(`/l2book?${usp.toString()}`);
  return mapL2Book(params.symbol, raw);
}

// Unsigned account read (public read-only)
export async function postAccount(params: {
  wallet: string;
  request:
    | "fullAccount"
    | "openOrders"
    | "fills"
    | "positions"
    | "fundingHistory"
    | "orderHistory";
  limit?: number;
}): Promise<{ fills?: Fill[]; positions?: Position[]; raw?: any }> {
  const raw = await bulkFetch<any>("/account", {
    method: "POST",
    json: {
      wallet: params.wallet,
      request: params.request,
      limit: params.limit,
    },
  });

  const out: any = { raw };
  if (raw?.fills) out.fills = mapFills(raw.fills);
  if (raw?.positions) out.positions = mapPositions(raw.positions);
  return out;
}
