import { create } from "zustand";
import { type CatProfile, db, getOrCreateCat } from "../db";

interface CatState {
  cat: CatProfile | null;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Omit<CatProfile, "id" | "updatedAt">>) => Promise<void>;
}

export const useCatStore = create<CatState>((set, get) => ({
  cat: null,
  loaded: false,

  load: async () => {
    const cat = await getOrCreateCat();
    set({ cat, loaded: true });
  },

  update: async (patch) => {
    const current = get().cat;
    if (!current) return;

    const updated: CatProfile = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await db.cat.put(updated);
    set({ cat: updated });
  },
}));
