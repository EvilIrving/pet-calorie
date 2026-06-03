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
  nfePercentOnDryMatter: number;
  kcalPer100g: number;
  kcalPerKg: number;
}

function macroDryMatterParts(macros: MacroPercents) {
  const dryMatter = 100 - macros.moisture - macros.ash - macros.fiber;
  if (dryMatter <= 0) {
    return { dryMatter: 0, proteinDm: 0, fatDm: 0, nfeDm: 0 };
  }
  const proteinDm = (macros.protein / 100) * dryMatter;
  const fatDm = (macros.fat / 100) * dryMatter;
  const nfeDm = Math.max(0, dryMatter - proteinDm - fatDm);
  return { dryMatter, proteinDm, fatDm, nfeDm };
}

export function calcMacroAnalysis(macros: MacroPercents): MacroAnalysis {
  const { dryMatter, nfeDm } = macroDryMatterParts(macros);
  if (dryMatter <= 0) {
    return {
      dryMatterPercent: 0,
      nfePercentOnDryMatter: 0,
      kcalPer100g: 0,
      kcalPerKg: 0,
    };
  }
  const kcalPer100g = calcKcalFromMacros(macros);
  return {
    dryMatterPercent: dryMatter,
    nfePercentOnDryMatter: (nfeDm / dryMatter) * 100,
    kcalPer100g,
    kcalPerKg: kcalPer100g * 10,
  };
}

export function calcKcalFromMacros(macros: MacroPercents): number {
  const { proteinDm, fatDm, nfeDm } = macroDryMatterParts(macros);
  if (proteinDm === 0 && fatDm === 0 && nfeDm === 0) return 0;
  return proteinDm * atwater.protein + fatDm * atwater.fat + nfeDm * atwater.nfe;
}

/** 每日可喂克数 */
export function calcDailyGrams(dailyKcal: number, kcalPerKg: number): number {
  if (kcalPerKg <= 0 || dailyKcal <= 0) return 0;
  return (dailyKcal / kcalPerKg) * 1000;
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
): number {
  const rer = calcRer(weightKg);
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
