import {
  type ActivityLevel,
  activityMultiplier,
  atwater,
  type DietPhaseKey,
  dietPhases,
  type LifeStage,
  lifeFactor,
  minRerRatio,
  type Species,
  safeWeightLossRate,
} from "../config/nutrition";

export interface MacroPercents {
  protein: number;
  fat: number;
  ash: number;
  fiber: number;
  moisture: number;
}

/** RER (kcal/day) = 70 × weight^0.75，猫狗通用 */
export function calcRer(weightKg: number): number {
  if (weightKg <= 0) return 0;
  return 70 * weightKg ** 0.75;
}

/** 维持能量 MER = RER × lifeFactor × activity，用于热量计算 Tab */
export function calcMer(
  weightKg: number,
  lifeStage: LifeStage,
  activity: ActivityLevel,
  species: Species = "cat",
): number {
  const rer = calcRer(weightKg);
  return rer * lifeFactor[species][lifeStage] * activityMultiplier[activity];
}

export interface MacroAnalysis {
  dryMatterPercent: number;
  nfePercentAsFed: number;
  nfePercentOnDryMatter: number;
  kcalPer100g: number;
  kcalPerKg: number;
}

export interface MixedFeedingPlan {
  dryRatio: number;
  wetRatio: number;
  dryKcal: number;
  wetKcal: number;
  dryGrams: number;
  wetGrams: number;
}

export interface SafeWeightLossPlan {
  rateMin: number;
  rateMax: number;
  targetMinKg: number;
  targetMaxKg: number;
  targetWeightKg: number;
  totalWeeksMin: number;
  totalWeeksMax: number;
}

function macroAsFedParts(macros: MacroPercents) {
  const dryMatter = Math.max(0, 100 - macros.moisture);
  const nfeAsFed = Math.max(
    0,
    100 - macros.protein - macros.fat - macros.ash - macros.fiber - macros.moisture,
  );
  return { dryMatter, nfeAsFed };
}

export function calcMacroAnalysis(macros: MacroPercents): MacroAnalysis {
  const { dryMatter, nfeAsFed } = macroAsFedParts(macros);
  if (dryMatter <= 0) {
    return {
      dryMatterPercent: 0,
      nfePercentAsFed: 0,
      nfePercentOnDryMatter: 0,
      kcalPer100g: 0,
      kcalPerKg: 0,
    };
  }
  const kcalPer100g = calcKcalFromMacros(macros);
  return {
    dryMatterPercent: dryMatter,
    nfePercentAsFed: nfeAsFed,
    nfePercentOnDryMatter: (nfeAsFed / dryMatter) * 100,
    kcalPer100g,
    kcalPerKg: kcalPer100g * 10,
  };
}

export function calcKcalFromMacros(macros: MacroPercents): number {
  const { dryMatter, nfeAsFed } = macroAsFedParts(macros);
  if (dryMatter <= 0) return 0;
  return macros.protein * atwater.protein + macros.fat * atwater.fat + nfeAsFed * atwater.nfe;
}

/** 每日可喂克数 */
export function calcDailyGrams(dailyKcal: number, kcalPerKg: number): number {
  if (kcalPerKg <= 0 || dailyKcal <= 0) return 0;
  return (dailyKcal / kcalPerKg) * 1000;
}

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}

export function calcMixedFeedingPlan(
  dailyKcal: number,
  dryKcalPerKg: number,
  wetKcalPerKg: number,
  dryRatio: number,
): MixedFeedingPlan {
  const safeDailyKcal = Math.max(0, dailyKcal);
  const safeDryRatio = clampRatio(dryRatio);
  const wetRatio = 1 - safeDryRatio;
  const dryKcal = safeDailyKcal * safeDryRatio;
  const wetKcal = safeDailyKcal * wetRatio;
  return {
    dryRatio: safeDryRatio,
    wetRatio,
    dryKcal,
    wetKcal,
    dryGrams: calcDailyGrams(dryKcal, dryKcalPerKg),
    wetGrams: calcDailyGrams(wetKcal, wetKcalPerKg),
  };
}

function calcWeeksToWeight(startWeightKg: number, idealWeightKg: number, rate: number): number {
  if (startWeightKg <= idealWeightKg || rate <= 0 || rate >= 1) return 0;
  return Math.max(1, Math.ceil(Math.log(idealWeightKg / startWeightKg) / Math.log(1 - rate)));
}

export function calcSafeWeightLossPlan(
  startWeightKg: number,
  idealWeightKg: number | null,
  week: number,
  species: Species,
): SafeWeightLossPlan {
  const rate = safeWeightLossRate[species];
  const safeWeek = Math.max(1, Math.floor(week));
  const safeStart = Math.max(0, startWeightKg);
  const safeIdeal =
    idealWeightKg && idealWeightKg > 0 ? Math.min(idealWeightKg, safeStart) : safeStart;

  if (safeStart <= 0 || safeIdeal >= safeStart) {
    return {
      rateMin: rate.min,
      rateMax: rate.max,
      targetMinKg: safeStart,
      targetMaxKg: safeStart,
      targetWeightKg: safeStart,
      totalWeeksMin: 0,
      totalWeeksMax: 0,
    };
  }

  const targetMinKg = Math.max(safeIdeal, safeStart * (1 - rate.max) ** safeWeek);
  const targetMaxKg = Math.max(safeIdeal, safeStart * (1 - rate.min) ** safeWeek);
  return {
    rateMin: rate.min,
    rateMax: rate.max,
    targetMinKg,
    targetMaxKg,
    targetWeightKg: targetMaxKg,
    totalWeeksMin: calcWeeksToWeight(safeStart, safeIdeal, rate.max),
    totalWeeksMax: calcWeeksToWeight(safeStart, safeIdeal, rate.min),
  };
}

export function getDietPhaseKey(week: number, _species: Species = "cat"): DietPhaseKey {
  const phases = dietPhases.cat;
  if (week <= phases.transition.weeks[1]) return "transition";
  if (week <= phases.main.weeks[1]) return "main";
  return "intensive";
}

export function getDietPhaseRatio(week: number, species: Species): number {
  const key = getDietPhaseKey(week, species);
  return dietPhases[species][key].ratio;
}

/** 减肥 Tab 目标热量：RER × 阶段 ratio，以物种 minRerRatio 兜底 */
export function calcDietDailyKcal(
  weightKg: number,
  week: number,
  species: Species = "cat",
  idealWeightKg: number | null = null,
): number {
  const targetWeightKg = idealWeightKg && idealWeightKg > 0 ? idealWeightKg : weightKg;
  const rer = calcRer(targetWeightKg);
  if (rer <= 0) return 0;
  const ratio = getDietPhaseRatio(week, species);
  const target = rer * ratio;
  const floor = rer * minRerRatio[species];
  return Math.max(target, floor);
}

export function calcTotalDietWeeks(species: Species = "cat"): number {
  return dietPhases[species].intensive.weeks[0] + 8;
}

export function calcDietProgressPercent(week: number, species: Species = "cat"): number {
  const total = calcTotalDietWeeks(species);
  return Math.min(100, Math.max(0, (week / total) * 100));
}
