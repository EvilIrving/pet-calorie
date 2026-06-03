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
  petId: number;
  name: string;
  foodType: "dry" | "wet";
  kcalPerKg: number;
  macros: MacroPercents | null;
  createdAt: string;
}

export interface WeightLog {
  id?: number;
  petId: number;
  date: string;
  weightKg: number;
}

/** 每日实际喂食量（同一宠物每天一条，同日覆盖）；未喂某类粮时该字段为 null */
export interface FeedingLog {
  id?: number;
  petId: number;
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
      foods: "++id, petId, foodType, createdAt",
      weightLogs: "++id, petId, date",
      feedingLogs: "++id, petId, &[petId+date]",
    });

    this.version(2).stores({
      cat: "++id",
      foods: "++id, petId, foodType, createdAt",
      weightLogs: "++id, date, petId",
      feedingLogs: "++id, petId, &[petId+date]",
    });
  }
}

export const db = new CatDatabase();

export async function initDb(): Promise<void> {
  try {
    await db.open();
  } catch {
    db.close();
    await Dexie.delete("react-cat");
    await db.open();
  }
}

/** 获取所有宠物列表（按 id 排序） */
export async function getAllCats(): Promise<CatProfile[]> {
  return db.cat.orderBy("id").toArray();
}

/** 获取或创建默认宠物（App 首次启动时使用） */
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

  return createDefaultCat();
}

/** 创建默认宠物档案并返回 */
export async function createDefaultCat(): Promise<CatProfile> {
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

/** 删除指定宠物及其关联的全部数据（foods / weightLogs / feedingLogs） */
export async function deleteCatAndData(petId: number): Promise<void> {
  await db.transaction("rw", db.cat, db.foods, db.weightLogs, db.feedingLogs, async () => {
    await Promise.all([
      db.cat.delete(petId),
      db.foods.where("petId").equals(petId).delete(),
      db.weightLogs.where("petId").equals(petId).delete(),
      db.feedingLogs.where("petId").equals(petId).delete(),
    ]);
  });
}

/** 清空全部本地数据并创建默认宠物档案（用于设置页「删除全部」后重新开始） */
export async function resetAllAppData(): Promise<CatProfile> {
  await db.transaction("rw", db.cat, db.foods, db.weightLogs, db.feedingLogs, async () => {
    await Promise.all([
      db.cat.clear(),
      db.foods.clear(),
      db.weightLogs.clear(),
      db.feedingLogs.clear(),
    ]);
  });
  return createDefaultCat();
}
