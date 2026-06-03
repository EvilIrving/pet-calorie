import { create } from "zustand";
import {
  type CatProfile,
  createDefaultCat,
  db,
  deleteCatAndData,
  getAllCats,
  getOrCreateCat,
} from "../db";

interface CatState {
  cats: CatProfile[];
  activePetId: number | null;
  activePet: CatProfile | null;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Omit<CatProfile, "id" | "updatedAt">>) => Promise<void>;
  updatePet: (petId: number, patch: Partial<Omit<CatProfile, "id" | "updatedAt">>) => Promise<void>;
  addPet: () => Promise<CatProfile>;
  switchPet: (petId: number) => void;
  deletePet: (petId: number) => Promise<void>;
}

const LAST_PET_KEY = "react-cat:lastPetId";

function readLastPetId(): number | null {
  try {
    const raw = localStorage.getItem(LAST_PET_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

function writeLastPetId(id: number): void {
  try {
    localStorage.setItem(LAST_PET_KEY, String(id));
  } catch {
    // ignore
  }
}

export const useCatStore = create<CatState>((set, get) => ({
  cats: [],
  activePetId: null,
  activePet: null,
  loaded: false,

  load: async () => {
    const cats = await getAllCats();
    if (cats.length === 0) {
      const cat = await getOrCreateCat();
      writeLastPetId(cat.id);
      set({ cats: [cat], activePetId: cat.id, activePet: cat, loaded: true });
      return;
    }
    const storedId = readLastPetId();
    const activeId = storedId && cats.some((c) => c.id === storedId) ? storedId : cats[0].id;
    const activePet = cats.find((c) => c.id === activeId) ?? cats[0];
    set({ cats, activePetId: activeId, activePet, loaded: true });
  },

  update: async (patch) => {
    const current = get().activePet;
    if (!current) return;

    const updated: CatProfile = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await db.cat.put(updated);
    const cats = get().cats.map((c) => (c.id === updated.id ? updated : c));
    set({ cats, activePet: updated });
  },

  updatePet: async (petId, patch) => {
    const cats = get().cats;
    const target = cats.find((c) => c.id === petId);
    if (!target) return;

    const updated: CatProfile = {
      ...target,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await db.cat.put(updated);
    const nextCats = cats.map((c) => (c.id === petId ? updated : c));
    const nextActive = get().activePetId === petId ? updated : get().activePet;
    set({ cats: nextCats, activePet: nextActive ?? null });
  },

  addPet: async () => {
    const cat = await createDefaultCat();
    const cats = [...get().cats, cat];
    writeLastPetId(cat.id);
    set({ cats, activePetId: cat.id, activePet: cat });
    return cat;
  },

  switchPet: (petId: number) => {
    const cat = get().cats.find((c) => c.id === petId);
    if (cat) {
      writeLastPetId(petId);
      set({ activePetId: petId, activePet: cat });
    }
  },

  deletePet: async (petId: number) => {
    await deleteCatAndData(petId);

    const remaining = get().cats.filter((c) => c.id !== petId);
    if (remaining.length === 0) {
      const cat = await createDefaultCat();
      writeLastPetId(cat.id);
      set({ cats: [cat], activePetId: cat.id, activePet: cat });
      return;
    }
    const { activePetId } = get();
    const nextId =
      activePetId === petId
        ? remaining[0].id
        : (remaining.find((c) => c.id === activePetId)?.id ?? remaining[0].id);
    const nextPet = remaining.find((c) => c.id === nextId) ?? remaining[0];
    writeLastPetId(nextPet.id);
    set({ cats: remaining, activePetId: nextId, activePet: nextPet });
  },
}));
