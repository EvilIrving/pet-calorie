import type { FeedingLog } from "../db";

export type FeedingMode = "none" | "dry" | "wet" | "mixed";

export interface FeedingSummary {
  /** 实际摄入热量（kcal/天） */
  actualKcal: number;
  /** 相对目标的差值（kcal，正=多喂），保留整数 */
  deltaKcal: number;
}

export function deriveFeedingMode(hasDry: boolean, hasWet: boolean): FeedingMode {
  if (hasDry && hasWet) return "mixed";
  if (hasDry) return "dry";
  if (hasWet) return "wet";
  return "none";
}

export function canRecordDry(mode: FeedingMode): boolean {
  return mode === "dry" || mode === "mixed";
}

export function canRecordWet(mode: FeedingMode): boolean {
  return mode === "wet" || mode === "mixed";
}

/** 单类粮克数 × 热量密度(kcal/kg) → kcal；克数为空或密度无效时记 0 */
function gramsToKcal(grams: number | null, kcalPerKg: number): number {
  if (!grams || grams <= 0 || kcalPerKg <= 0) return 0;
  return (grams / 1000) * kcalPerKg;
}

/** 当日实际摄入热量 = 干粮 + 湿粮 */
export function calcFeedingKcal(
  log: Pick<FeedingLog, "dryGrams" | "wetGrams">,
  dryKcalPerKg: number,
  wetKcalPerKg: number,
): number {
  return gramsToKcal(log.dryGrams, dryKcalPerKg) + gramsToKcal(log.wetGrams, wetKcalPerKg);
}

/** 实际 vs 目标对比摘要；无记录时返回 null */
export function summarizeFeeding(
  log: Pick<FeedingLog, "dryGrams" | "wetGrams"> | null,
  dryKcalPerKg: number,
  wetKcalPerKg: number,
  targetKcal: number,
): FeedingSummary | null {
  if (!log) return null;
  const actualKcal = calcFeedingKcal(log, dryKcalPerKg, wetKcalPerKg);
  return {
    actualKcal: Math.round(actualKcal),
    deltaKcal: Math.round(actualKcal - targetKcal),
  };
}
