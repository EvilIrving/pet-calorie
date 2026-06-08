import type { CatProfile, SavedFood, WeightLog } from "../db";
import {
  calcDailyGrams,
  calcDietDailyKcalRange,
  calcMer,
  calcMixedFeedingPlan,
  calcSafeWeightLossPlan,
} from "./calculator";
import { addDays, diffDays, toLocalDateString } from "./date";
import { canRecordDry, canRecordWet } from "./feeding";
import { calcDietReferenceWeightKg, summarizeWeightLogs } from "./weightLog";

export interface PrintPlanFoodLine {
  foodType: "dry" | "wet";
  planned: boolean;
  configured: boolean;
  grams: number | null;
  kcalPerKg: number | null;
}

export interface PrintPlanDailyCheck {
  index: number;
  date: string;
}

export interface PrintPlanWeeklyWeightRow {
  week: number;
  weekStartDate: string;
  targetMinKg: number;
  targetMaxKg: number;
}

export interface PrintPlanData {
  generatedDate: string;
  petName: string;
  species: CatProfile["species"];
  currentWeightKg: number;
  targetWeightKg: number | null;
  bcsScore: number | null;
  planStartDate: string;
  currentWeek: number;
  dailyKcalMin: number;
  dailyKcalMax: number;
  planEndDate: string;
  dryLine: PrintPlanFoodLine;
  wetLine: PrintPlanFoodLine;
  dryRatioPercent: number | null;
  wetRatioPercent: number | null;
  weighEveryDays: number;
  dailyChecks: PrintPlanDailyCheck[];
  weeklyWeights: PrintPlanWeeklyWeightRow[];
}

export interface BuildPrintPlanDataInput {
  pet: CatProfile;
  foods: SavedFood[];
  weightLogs: WeightLog[];
  generatedDate?: string;
}

function getDietWeek(planStartDate: string, generatedDate: string): number {
  return Math.max(1, Math.floor(diffDays(planStartDate, generatedDate) / 7) + 1);
}

function latestFood(foods: SavedFood[], foodType: "dry" | "wet"): SavedFood | null {
  return foods.find((food) => food.foodType === foodType && food.kcalPerKg > 0) ?? null;
}

function foodLine(
  foodType: "dry" | "wet",
  planned: boolean,
  food: SavedFood | null,
  grams: number | null,
): PrintPlanFoodLine {
  return {
    foodType,
    planned,
    configured: planned && food !== null,
    grams: planned && food !== null ? grams : null,
    kcalPerKg: planned ? (food?.kcalPerKg ?? null) : null,
  };
}

export function buildPrintPlanData({
  pet,
  foods,
  weightLogs,
  generatedDate = toLocalDateString(),
}: BuildPrintPlanDataInput): PrintPlanData {
  const planStartDate = pet.dietStartDate
    ? toLocalDateString(new Date(pet.dietStartDate))
    : generatedDate;
  const currentWeek = getDietWeek(planStartDate, generatedDate);
  const latestWeight = summarizeWeightLogs(weightLogs)?.currentKg ?? pet.weightKg;
  const startWeightKg = pet.dietStartWeightKg ?? pet.weightKg;
  const referenceWeightKg = calcDietReferenceWeightKg(
    weightLogs,
    pet.dietStartDate,
    currentWeek,
    startWeightKg,
  );
  const planIdealWeightKg =
    pet.idealWeightKg && pet.idealWeightKg > 0 && pet.idealWeightKg < pet.weightKg
      ? pet.idealWeightKg
      : Math.round(pet.weightKg * 0.9 * 10) / 10;
  const safePlan = calcSafeWeightLossPlan(referenceWeightKg, planIdealWeightKg, 1, pet.species);
  const mer = calcMer(pet.weightKg, pet.lifeStage, pet.activity, pet.species);
  const dailyKcalRange = calcDietDailyKcalRange(
    mer,
    referenceWeightKg,
    safePlan.targetMinKg,
    safePlan.targetMaxKg,
  );
  // Plan duration: latest weight log → target, fallback to profile weight
  const totalRemainingWeeks = Math.max(
    4,
    calcSafeWeightLossPlan(latestWeight, planIdealWeightKg, 1, pet.species).totalWeeksMax,
  );
  const totalDays = totalRemainingWeeks * 7;
  const planEndDate = addDays(generatedDate, totalDays - 1);
  const dailyKcal = dailyKcalRange.max;
  const dryFood = latestFood(foods, "dry");
  const wetFood = latestFood(foods, "wet");
  const dryPlanned = canRecordDry(pet.feedingMode);
  const wetPlanned = canRecordWet(pet.feedingMode);
  const mixedPlan = calcMixedFeedingPlan(
    dailyKcal,
    dryFood?.kcalPerKg ?? 0,
    wetFood?.kcalPerKg ?? 0,
    pet.mixedDryRatio,
  );
  const dryGrams =
    pet.feedingMode === "mixed"
      ? Math.round(mixedPlan.dryGrams)
      : Math.round(calcDailyGrams(dailyKcal, dryFood?.kcalPerKg ?? 0));
  const wetGrams =
    pet.feedingMode === "mixed"
      ? Math.round(mixedPlan.wetGrams)
      : Math.round(calcDailyGrams(dailyKcal, wetFood?.kcalPerKg ?? 0));

  return {
    generatedDate,
    petName: pet.name,
    species: pet.species,
    currentWeightKg: latestWeight,
    targetWeightKg: planIdealWeightKg,
    bcsScore: pet.bcsScore,
    planStartDate,
    currentWeek,
    dailyKcalMin: dailyKcalRange.min,
    dailyKcalMax: dailyKcalRange.max,
    dryLine: foodLine("dry", dryPlanned, dryFood, dryGrams),
    wetLine: foodLine("wet", wetPlanned, wetFood, wetGrams),
    dryRatioPercent: pet.feedingMode === "mixed" ? Math.round(pet.mixedDryRatio * 100) : null,
    wetRatioPercent: pet.feedingMode === "mixed" ? Math.round((1 - pet.mixedDryRatio) * 100) : null,
    planEndDate,
    weighEveryDays: 7,
    dailyChecks: Array.from({ length: totalDays }, (_, index) => ({
      index: index + 1,
      date: addDays(generatedDate, index),
    })),
    weeklyWeights: Array.from({ length: totalRemainingWeeks }, (_, index) => {
      const week = currentWeek + index;
      const plan = calcSafeWeightLossPlan(latestWeight, planIdealWeightKg, index + 1, pet.species);
      return {
        week,
        weekStartDate: addDays(planStartDate, (week - 1) * 7),
        targetMinKg: plan.targetMinKg,
        targetMaxKg: plan.targetMaxKg,
      };
    }),
  };
}
