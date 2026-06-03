import { create } from "zustand";
import { db, type SavedFood } from "../db";

interface FoodState {
  foods: SavedFood[];
  loaded: boolean;
  load: (petId: number) => Promise<void>;
  save: (petId: number, food: Omit<SavedFood, "id" | "createdAt" | "petId">) => Promise<void>;
  clear: () => void;
}

export const useFoodStore = create<FoodState>((set) => ({
  foods: [],
  loaded: false,

  load: async (petId: number) => {
    const foods = await db.foods.where("petId").equals(petId).reverse().sortBy("createdAt");
    set({ foods, loaded: true });
  },

  save: async (petId, food) => {
    const createdAt = new Date().toISOString();
    await db.foods.add({ ...food, petId, createdAt });
    const foods = await db.foods.where("petId").equals(petId).reverse().sortBy("createdAt");
    set({ foods });
  },

  clear: () => set({ foods: [], loaded: true }),
}));
