// =========================
// domain/bulk/mappers.ts
// =========================
import type {
  Kline,
  L2Book,
  L2Level,
  Market,
  Ticker,
  Fill,
  Position,
} from "./models";

// Bulk seems to use compact fields. We normalize here.
// These are defensive: accept multiple possible keys.
const num = (v: any): number | undefined =>
  v === null || v === undefined || v === "" ? undefined : Number(v);
const ms = (v: any): number | undefined => {
  const n = num(v);
  if (n === undefined) return undefined;

  // seconds
  if (n < 1e12) return Math.floor(n * 1000);
  // milliseconds
  if (n < 1e15) return Math.floor(n);
  // microseconds
  if (n < 1e18) return Math.floor(n / 1e3);
  // nanoseconds
  return Math.floor(n / 1e6);
};

export function mapMarket(raw: any): Market {
  return {
    symbol: String(raw.symbol ?? raw.s ?? ""),
    baseAsset: raw.baseAsset ?? raw.base ?? raw.b,
    quoteAsset: raw.quoteAsset ?? raw.quote ?? raw.q,
    status: raw.status ?? raw.st,
    tickSize: num(raw.tickSize ?? raw.tickSz ?? raw.ts),
    stepSize: num(raw.stepSize ?? raw.stepSz ?? raw.ss),
  };
}

export function mapTicker(symbol: string, raw: any) {
  return {
    symbol,
    last: num(raw.lastPrice ?? raw.last ?? raw.px ?? raw.c),
    // frontendContext n'a pas mark/oracle -> on laisse undefined (UI fait déjà mark ?? last)
    mark: num(raw.markPrice ?? raw.mark ?? raw.markPx ?? raw.mp),
    oracle: num(raw.oraclePrice ?? raw.oracle ?? raw.oraclePx ?? raw.op),

    // ✅ frontendContext: funding (pas fundingRate)
    fundingRate: num(raw.fundingRate ?? raw.fr ?? raw.funding),

    // ✅ frontendContext: oi (ok) + openInterest (REST)
    openInterest: num(raw.openInterest ?? raw.oi),

    // ✅ frontendContext: volume (base) ; REST: quoteVolume (USDC)
    // On garde la préférence quoteVolume si dispo, sinon volume.
    volume24h: num(
      raw.quoteVolume ?? raw.volume ?? raw.volume24h ?? raw.v24h ?? raw.v,
    ),

    // frontendContext n'a pas high/low -> undefined, c'est ok (REST les remplit)
    high24h: num(raw.highPrice ?? raw.high24h ?? raw.h24h ?? raw.h),
    low24h: num(raw.lowPrice ?? raw.low24h ?? raw.l24h ?? raw.l),

    // ✅ frontendContext fournit priceChange et priceChangePercent
    change24h: num(raw.priceChange ?? raw.change24h ?? raw.ch24h),

    // (optionnel mais utile pour la UI)
    change24hPct: num(raw.priceChangePercent ?? raw.change24hPct ?? raw.pct),

    timestamp: ms(raw.timestamp ?? raw.ts ?? raw.time ?? raw.t),
  };
}

export function mapKlines(raw: any[]): Kline[] {
  // Many exchanges use [t,o,h,l,c,v] arrays.
  return (raw ?? []).map((k: any) => {
    if (Array.isArray(k)) {
      return {
        t: ms(k[0])!,
        o: Number(k[1]),
        h: Number(k[2]),
        l: Number(k[3]),
        c: Number(k[4]),
        v: Number(k[5]),
      };
    }
    return {
      t: ms(k.t ?? k[0])!,
      o: Number(k.o ?? k[1]),
      h: Number(k.h ?? k[2]),
      l: Number(k.l ?? k[3]),
      c: Number(k.c ?? k[4]),
      v: Number(k.v ?? k[5]),
    };
  });
}

export function mapL2Book(symbol: string, raw: any): L2Book {
  const mapSide = (arr: any[]): L2Level[] =>
    (arr ?? []).map((lv: any) =>
      Array.isArray(lv)
        ? { px: Number(lv[0]), sz: Number(lv[1]) }
        : { px: Number(lv.px), sz: Number(lv.sz) },
    );
  return {
    symbol,
    bids: mapSide(raw.bids ?? raw.b ?? []),
    asks: mapSide(raw.asks ?? raw.a ?? []),
    ts: ms(raw.ts ?? raw.t),
  };
}

export function mapFills(raw: any[]): Fill[] {
  return (raw ?? []).map((f: any) => ({
    symbol: String(f.symbol ?? f.s ?? ""),
    side:
      (f.side ?? f.sd) === "buy" || (f.side ?? f.sd) === "B" ? "buy" : "sell",
    px: num(f.px ?? f.price),
    sz: num(f.sz ?? f.size ?? f.qty),
    fee: num(f.fee),
    ts: ms(f.ts ?? f.t),
  }));
}

export function mapPositions(raw: any[]): Position[] {
  return (raw ?? []).map((p: any) => ({
    symbol: String(p.symbol ?? p.s ?? ""),
    side:
      (p.side ?? p.sd) === "long" || (p.side ?? p.sd) === "L"
        ? "long"
        : "short",
    sz: num(p.sz ?? p.size ?? p.qty),
    entryPx: num(p.entryPx ?? p.epx ?? p.entryPrice),
    markPx: num(p.markPx ?? p.mpx ?? p.markPrice),
    pnlUnrealized: num(p.pnlUnrealized ?? p.upnl),
    leverage: num(p.leverage ?? p.lev),
  }));
}
