import Dexie from "dexie";
import type { CatProfile, FeedingLog, SavedFood } from "../db";
import { db } from "../db";

const TODAY = "2026-06-03";

function dateAddDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function biweeklyDates(count: number): string[] {
  const dates: string[] = [];
  let d = TODAY;
  for (let i = 0; i < count; i++) {
    dates.unshift(d);
    d = dateAddDays(d, -14);
  }
  return dates;
}

function everyNDays(count: number, interval: number): string[] {
  const dates: string[] = [];
  let d = TODAY;
  for (let i = 0; i < count; i++) {
    dates.unshift(d);
    d = dateAddDays(d, -interval);
  }
  return dates;
}

interface PetBlueprint {
  profile: Omit<CatProfile, "id" | "updatedAt">;
  foods: Omit<SavedFood, "id" | "petId" | "createdAt">[];
  weightLogKg: number[];
  feedingLog: (petId: number, dates: string[]) => FeedingLog[];
}

const blueprints: PetBlueprint[] = [
  {
    profile: {
      species: "cat",
      name: "小橘",
      weightKg: 5.8,
      idealWeightKg: 4.5,
      lifeStage: "adult_neutered",
      neutered: true,
      activity: "low",
      feedingMode: "dry",
      mixedDryRatio: 0.5,
      dietStartDate: "2026-03-03",
      dietStartWeightKg: 6.2,
      onboardingDone: true,
    },
    foods: [
      {
        name: "皇家成猫粮",
        foodType: "dry",
        kcalPerKg: 3800,
        macros: { protein: 34, fat: 16, ash: 8, fiber: 5, moisture: 7 },
      },
    ],
    weightLogKg: [6.2, 6.05, 5.95, 5.85, 5.78, 5.75, 5.8, 5.8],
    feedingLog: (petId, dates) =>
      dates.map((date, i) => ({
        petId,
        date,
        dryGrams: Math.round(45 + i * 2),
        wetGrams: null,
      })),
  },
  {
    profile: {
      species: "dog",
      name: "旺财",
      weightKg: 14.5,
      idealWeightKg: 14.5,
      lifeStage: "adult_intact",
      neutered: false,
      activity: "moderate",
      feedingMode: "wet",
      mixedDryRatio: 0.5,
      dietStartDate: null,
      dietStartWeightKg: null,
      onboardingDone: true,
    },
    foods: [
      {
        name: "自制湿粮",
        foodType: "wet",
        kcalPerKg: 950,
        macros: { protein: 12, fat: 6, ash: 2, fiber: 1, moisture: 75 },
      },
    ],
    weightLogKg: [14.6, 14.3, 14.55, 14.5, 14.4, 14.55, 14.48, 14.5],
    feedingLog: (petId, dates) =>
      dates.map((date) => ({
        petId,
        date,
        dryGrams: null,
        wetGrams: 380,
      })),
  },
  {
    profile: {
      species: "cat",
      name: "咪咪",
      weightKg: 2.8,
      idealWeightKg: null,
      lifeStage: "kitten",
      neutered: false,
      activity: "high",
      feedingMode: "mixed",
      mixedDryRatio: 0.6,
      dietStartDate: null,
      dietStartWeightKg: null,
      onboardingDone: true,
    },
    foods: [
      {
        name: "幼猫干粮",
        foodType: "dry",
        kcalPerKg: 4200,
        macros: { protein: 36, fat: 18, ash: 7, fiber: 3, moisture: 8 },
      },
      {
        name: "幼猫湿粮",
        foodType: "wet",
        kcalPerKg: 1050,
        macros: { protein: 11, fat: 5, ash: 2, fiber: 0.5, moisture: 78 },
      },
    ],
    weightLogKg: [1.5, 1.8, 2.1, 2.4, 2.55, 2.68, 2.75, 2.8],
    feedingLog: (petId, dates) =>
      dates.map((date, i) => ({
        petId,
        date,
        dryGrams: Math.round(30 + i * 1.5),
        wetGrams: Math.round(60 + i),
      })),
  },
  {
    profile: {
      species: "dog",
      name: "小黑",
      weightKg: 28.0,
      idealWeightKg: 22.0,
      lifeStage: "senior",
      neutered: true,
      activity: "low",
      feedingMode: "dry",
      mixedDryRatio: 0.5,
      dietStartDate: "2026-03-03",
      dietStartWeightKg: 30.0,
      onboardingDone: true,
    },
    foods: [
      {
        name: "老年犬粮",
        foodType: "dry",
        kcalPerKg: 3200,
        macros: { protein: 28, fat: 12, ash: 7, fiber: 8, moisture: 9 },
      },
    ],
    weightLogKg: [30.0, 29.5, 29.1, 28.7, 28.4, 28.2, 28.1, 28.0],
    feedingLog: (petId, dates) =>
      dates.map((date, i) => ({
        petId,
        date,
        dryGrams: Math.round(280 - i * 6),
        wetGrams: null,
      })),
  },
  {
    profile: {
      species: "cat",
      name: "花花",
      weightKg: 4.0,
      idealWeightKg: 4.0,
      lifeStage: "adult_neutered",
      neutered: true,
      activity: "high",
      feedingMode: "mixed",
      mixedDryRatio: 0.4,
      dietStartDate: null,
      dietStartWeightKg: null,
      onboardingDone: true,
    },
    foods: [
      {
        name: "渴望鸡肉猫粮",
        foodType: "dry",
        kcalPerKg: 3700,
        macros: { protein: 40, fat: 20, ash: 8, fiber: 4, moisture: 10 },
      },
      {
        name: "巅峰主食罐",
        foodType: "wet",
        kcalPerKg: 880,
        macros: { protein: 10, fat: 5.5, ash: 1.5, fiber: 0.5, moisture: 78 },
      },
    ],
    weightLogKg: [4.05, 3.98, 4.02, 4.0, 3.97, 4.01, 4.0, 4.0],
    feedingLog: (petId, dates) =>
      dates.map((date) => ({
        petId,
        date,
        dryGrams: 22,
        wetGrams: 120,
      })),
  },
];

export async function seedDemoData(): Promise<void> {
  db.close();
  await Dexie.delete("react-cat");
  await db.open();

  const now = new Date().toISOString();
  const weightDates = biweeklyDates(8);
  const feedingDates = everyNDays(30, 3);

  for (const bp of blueprints) {
    const petId = await db.cat.add({
      ...bp.profile,
      updatedAt: now,
    });

    for (const food of bp.foods) {
      await db.foods.add({
        ...food,
        petId,
        createdAt: now,
      });
    }

    for (let i = 0; i < weightDates.length; i++) {
      await db.weightLogs.add({
        petId,
        date: weightDates[i],
        weightKg: bp.weightLogKg[i],
      });
    }

    const logs = bp.feedingLog(petId, feedingDates);
    for (const log of logs) {
      await db.feedingLogs.add(log);
    }
  }
}
