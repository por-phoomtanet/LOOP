import { create } from "zustand";
import { productsApi } from "@/modules/products/services/productsApi";
import type { Category } from "@/modules/products/types";

type MasterState = {
  categories: Category[];
  loaded: boolean;
  loading: boolean;
  fetchCategories: () => Promise<void>;
  clearMaster: () => void;
};

export const useMasterStore = create<MasterState>((set, get) => ({
  categories: [],
  loaded: false,
  loading: false,
  fetchCategories: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const res = await productsApi.getCategories();
      set({ categories: res.data.data, loaded: true });
    } finally {
      set({ loading: false });
    }
  },
  clearMaster: () => set({ categories: [], loaded: false }),
}));
