// =========================
// stores/account.store.ts
// =========================
import { create } from "zustand";
import type { Fill, Position } from "@/domain/bulk/models";

type AccountState = {
  wallet?: string;
  fills: Fill[];
  positions: Position[];
  loading: boolean;
  error?: string;

  setWallet: (w?: string) => void;
  setAccountData: (d: { fills?: Fill[]; positions?: Position[] }) => void;
  setLoading: (v: boolean) => void;
  setError: (e?: string) => void;
};

export const useAccountStore = create<AccountState>((set) => ({
  wallet: undefined,
  fills: [],
  positions: [],
  loading: false,
  error: undefined,

  setWallet: (wallet) => set({ wallet }),
  setAccountData: (d) =>
    set((st) => ({
      fills: d.fills ?? st.fills,
      positions: d.positions ?? st.positions,
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
