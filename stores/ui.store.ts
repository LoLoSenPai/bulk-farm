// stores/ui.store.ts
import { create } from "zustand";

export type KlineInterval = "10s" | "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

type UiState = {
  klineInterval: KlineInterval;
  setKlineInterval: (v: KlineInterval) => void;
};

export const useUiStore = create<UiState>((set) => ({
  klineInterval: "1m",
  setKlineInterval: (v) => set({ klineInterval: v }),
}));
