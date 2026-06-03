import type { WeightLog } from "../db";
import { addDays, toLocalDateString } from "./date";

export interface WeightSummary {
  /** 最新一条（按日期）的体重 */
  currentKg: number;
  /** 上一条体重，仅一条记录时为 null */
  previousKg: number | null;
  /** 相对上一条的变化（kg，保留 1 位小数），仅一条记录时为 null */
  deltaKg: number | null;
}

/** 体重趋势摘要；传入的 logs 需按日期降序（最新在前） */
export function summarizeWeightLogs(logs: WeightLog[]): WeightSummary | null {
  if (logs.length === 0) return null;
  const currentKg = logs[0].weightKg;
  const previousKg = logs.length > 1 ? logs[1].weightKg : null;
  const deltaKg = previousKg === null ? null : Math.round((currentKg - previousKg) * 10) / 10;
  return { currentKg, previousKg, deltaKg };
}

export function calcDietReferenceWeightKg(
  logs: WeightLog[],
  dietStartIso: string | null,
  currentWeek: number,
  fallbackWeightKg: number,
): number {
  if (!dietStartIso || currentWeek <= 1) return fallbackWeightKg;
  const startDate = toLocalDateString(new Date(dietStartIso));
  const previousWeekStart = addDays(startDate, (Math.floor(currentWeek) - 2) * 7);
  const currentWeekStart = addDays(previousWeekStart, 7);
  const previousWeekLogs = logs.filter(
    (log) => log.date >= previousWeekStart && log.date < currentWeekStart,
  );
  if (previousWeekLogs.length === 0) return fallbackWeightKg;
  const total = previousWeekLogs.reduce((sum, log) => sum + log.weightKg, 0);
  return total / previousWeekLogs.length;
}
