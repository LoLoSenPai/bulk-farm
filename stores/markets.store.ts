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
    set((st) => ({
      tickerBySymbol: { ...st.tickerBySymbol, [t.symbol]: t },
    })),

  setL2: (b) =>
    set((st) => ({
      l2BySymbol: { ...st.l2BySymbol, [b.symbol]: b },
    })),

  setKlines: (symbol, k) =>
    set((st) => ({
      klinesBySymbol: { ...st.klinesBySymbol, [symbol]: k },
    })),
}));
