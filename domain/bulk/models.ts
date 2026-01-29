// =========================
// domain/bulk/models.ts
// =========================
export type SymbolId = string;

export type Market = {
  symbol: SymbolId;
  baseAsset?: string;
  quoteAsset?: string;
  status?: string;
  tickSize?: number;
  stepSize?: number;
};

export type Ticker = {
  symbol: SymbolId;
  last?: number;
  mark?: number;
  oracle?: number;
  fundingRate?: number;
  openInterest?: number;
  volume24h?: number;
  high24h?: number;
  low24h?: number;
  change24h?: number;
  timestamp?: number;
  change24hPct?: number;
};

export type Kline = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export type L2Level = { px: number; sz: number };
export type L2Book = {
  symbol: SymbolId;
  bids: L2Level[];
  asks: L2Level[];
  ts?: number;
};

export type Fill = {
  symbol: SymbolId;
  side?: "buy" | "sell";
  px?: number;
  sz?: number;
  fee?: number;
  ts?: number;
};

export type Position = {
  symbol: SymbolId;
  side?: "long" | "short";
  sz?: number;
  entryPx?: number;
  markPx?: number;
  pnlUnrealized?: number;
  leverage?: number;
};
