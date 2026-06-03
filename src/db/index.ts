import Dexie, { type EntityTable } from "dexie";
import {
  type ActivityLevel,
  defaultPetName,
  type LifeStage,
  type Species,
  weightRange,
} from "../config/nutrition";
import type { MacroPercents } from "../lib/calculator";
import type { FeedingMode } from "../lib/feeding";

export interface CatProfile {
  id: number;
  species: Species;
  name: string;
  weightKg: number;
  idealWeightKg: number | null;
  lifeStage: LifeStage;
  neutered: boolean;
  activity: ActivityLevel;
  feedingMode: FeedingMode;
  mixedDryRatio: number;
  dietStartDate: string | null;
  dietStartWeightKg: number | null;
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
      feedingLogs: "++id, &date",
    });
  }
}

export const db = new CatDatabase();

export async function initDb(): Promise<void> {
  await db.open();
}

/** 清空全部本地数据并创建默认宠物档案（用于设置页「删除」后重新开始） */
export async function resetAllAppData(): Promise<CatProfile> {
  await db.transaction("rw", db.cat, db.foods, db.weightLogs, db.feedingLogs, async () => {
    await Promise.all([
      db.cat.clear(),
      db.foods.clear(),
      db.weightLogs.clear(),
      db.feedingLogs.clear(),
    ]);
  });
  return getOrCreateCat();
}

export async function getOrCreateCat(): Promise<CatProfile> {
  const existing = await db.cat.orderBy("id").first();
  if (existing) {
    const normalized: CatProfile = {
      ...existing,
      idealWeightKg: existing.idealWeightKg ?? null,
      dietStartWeightKg: existing.dietStartWeightKg ?? null,
    };
    if (
      normalized.idealWeightKg !== existing.idealWeightKg ||
      normalized.dietStartWeightKg !== existing.dietStartWeightKg
    ) {
      await db.cat.put(normalized);
    }
    return normalized;
  }

  const now = new Date().toISOString();
  const species: Species = "cat";
  const id = await db.cat.add({
    species,
    name: defaultPetName[species],
    weightKg: weightRange[species].defaultKg,
    idealWeightKg: weightRange[species].defaultKg,
    lifeStage: "adult_neutered",
    neutered: true,
    activity: "low",
    feedingMode: "dry",
    mixedDryRatio: 0.5,
    dietStartDate: null,
    dietStartWeightKg: null,
    onboardingDone: false,
    updatedAt: now,
  });

  const created = await db.cat.get(id);
  if (!created) throw new Error("Failed to create default cat profile");
  return created;
}
