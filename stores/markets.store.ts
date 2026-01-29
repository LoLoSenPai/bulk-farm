// =========================
// stores/markets.store.ts
// =========================
import { create } from "zustand";
import type {
  Market,
  Ticker,
  L2Book,
  Kline,
  SymbolId,
} from "@/domain/bulk/models";

type MarketsState = {
  markets: Market[];
  selectedSymbol?: SymbolId;
  tickerBySymbol: Record<SymbolId, Ticker | undefined>;
  l2BySymbol: Record<SymbolId, L2Book | undefined>;
  klinesBySymbol: Record<SymbolId, Kline[] | undefined>;

  setMarkets: (m: Market[]) => void;
  selectSymbol: (s: SymbolId) => void;

  upsertTicker: (t: Ticker) => void;
  upsertTickers: (tickers: Ticker[]) => void;
  setL2: (b: L2Book) => void;
  setKlines: (symbol: SymbolId, k: Kline[]) => void;
};

export const useMarketsStore = create<MarketsState>((set) => ({
  markets: [],
  selectedSymbol: undefined,

  tickerBySymbol: {},
  l2BySymbol: {},
  klinesBySymbol: {},

  setMarkets: (markets) => set({ markets }),
  selectSymbol: (selectedSymbol) => set({ selectedSymbol }),

  upsertTicker: (t) =>
    set((st) => {
      const prev = st.tickerBySymbol[t.symbol];

      const merged = {
        ...prev,
        ...t,
        last: t.last ?? prev?.last,
        mark: t.mark ?? prev?.mark,
        oracle: t.oracle ?? prev?.oracle,
        fundingRate: t.fundingRate ?? prev?.fundingRate,
        openInterest: t.openInterest ?? prev?.openInterest,
        volume24h: t.volume24h ?? prev?.volume24h,
        high24h: t.high24h ?? prev?.high24h,
        low24h: t.low24h ?? prev?.low24h,
        change24h: t.change24h ?? prev?.change24h,
        change24hPct: (t as any).change24hPct ?? (prev as any)?.change24hPct,
        timestamp: t.timestamp ?? prev?.timestamp,
      };

      return {
        tickerBySymbol: { ...st.tickerBySymbol, [t.symbol]: merged },
      };
    }),

  upsertTickers: (tickers) =>
    set((st) => {
      const next = { ...st.tickerBySymbol };
      for (const t of tickers) next[t.symbol] = t;
      return { tickerBySymbol: next };
    }),

  setL2: (b) =>
    set((st) => ({
      l2BySymbol: { ...st.l2BySymbol, [b.symbol]: b },
    })),

  setKlines: (symbol, k) =>
    set((st) => ({
      klinesBySymbol: { ...st.klinesBySymbol, [symbol]: k },
    })),
}));
