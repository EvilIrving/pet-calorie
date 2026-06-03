import { create } from "zustand";
import { db, type SavedFood } from "../db";

interface FoodState {
  foods: SavedFood[];
  loaded: boolean;
  load: () => Promise<void>;
  save: (food: Omit<SavedFood, "id" | "createdAt">) => Promise<void>;
  clear: () => void;
}

export const useFoodStore = create<FoodState>((set) => ({
  foods: [],
  loaded: false,

  load: async () => {
    const foods = await db.foods.orderBy("createdAt").reverse().toArray();
    set({ foods, loaded: true });
  },

  save: async (food) => {
    const createdAt = new Date().toISOString();
    await db.foods.add({ ...food, createdAt });
    const foods = await db.foods.orderBy("createdAt").reverse().toArray();
    set({ foods });
  },

  clear: () => set({ foods: [], loaded: true }),
}));
