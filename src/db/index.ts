import Dexie, { type EntityTable } from "dexie";
import {
  type ActivityLevel,
  defaultPetName,
  type LifeStage,
  type Species,
  weightRange,
} from "../config/nutrition";
import type { MacroPercents } from "../lib/calculator";

export interface CatProfile {
  id: number;
  species: Species;
  name: string;
  weightKg: number;
  lifeStage: LifeStage;
  neutered: boolean;
  activity: ActivityLevel;
  dietStartDate: string | null;
  onboardingDone: boolean;
  updatedAt: string;
}

export interface SavedFood {
  id?: number;
  name: string;
  foodType: "dry" | "wet";
  kcalPerKg: number;
  macros: MacroPercents | null;
  createdAt: string;
}

export interface WeightLog {
  id?: number;
  date: string;
  weightKg: number;
}

/** 每日实际喂食量（每天一条，同日覆盖）；未喂某类粮时该字段为 null */
export interface FeedingLog {
  id?: number;
  date: string;
  dryGrams: number | null;
  wetGrams: number | null;
}

class CatDatabase extends Dexie {
  cat!: EntityTable<CatProfile, "id">;
  foods!: EntityTable<SavedFood, "id">;
  weightLogs!: EntityTable<WeightLog, "id">;
  feedingLogs!: EntityTable<FeedingLog, "id">;

  constructor() {
    super("react-cat");
    this.version(1).stores({
      cat: "++id",
      foods: "++id, foodType, createdAt",
      weightLogs: "++id, date",
    });
    this.version(2)
      .stores({
        cat: "++id",
        foods: "++id, foodType, createdAt",
        weightLogs: "++id, date",
      })
      .upgrade(async (tx) => {
        await tx
          .table("cat")
          .toCollection()
          .modify((row: CatProfile & { species?: Species; onboardingDone?: boolean }) => {
            row.species = row.species ?? "cat";
            row.onboardingDone = row.onboardingDone ?? true;
          });
      });
    this.version(3).stores({
      cat: "++id",
      foods: "++id, foodType, createdAt",
      weightLogs: "++id, date",
      feedingLogs: "++id, &date",
    });
  }
}

export const db = new CatDatabase();

export async function initDb(): Promise<void> {
  await db.open();
}

export async function getOrCreateCat(): Promise<CatProfile> {
  const existing = await db.cat.orderBy("id").first();
  if (existing) return existing;

  const now = new Date().toISOString();
  const species: Species = "cat";
  const id = await db.cat.add({
    species,
    name: defaultPetName[species],
    weightKg: weightRange[species].defaultKg,
    lifeStage: "adult_neutered",
    neutered: true,
    activity: "low",
    dietStartDate: null,
    onboardingDone: false,
    updatedAt: now,
  });

  const created = await db.cat.get(id);
  if (!created) throw new Error("Failed to create default cat profile");
  return created;
}
