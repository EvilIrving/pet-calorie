import type { CatProfile, FeedingLog, WeightLog } from "../db";
import { getBcsRisk } from "./bcs";
import { diffDays, toLocalDateString } from "./date";

export type PlanTipKind = "feeding" | "weight" | "plan";

export interface PlanTip {
  kind: PlanTipKind;
  messageKey:
    | "feeding.missingToday"
    | "weight.stale"
    | "plan.bcsUnknown"
    | "plan.bcsHigh"
    | "plan.lossFast"
    | "plan.stalled";
  priority: number;
}

export interface PlanTipsInput {
  pet: Pick<CatProfile, "bcsScore">;
  weightLogs: WeightLog[];
  feedingLogs: FeedingLog[];
  targetKcal: number;
  today?: string;
}

const messages: Record<PlanTip["messageKey"], string> = {
  "feeding.missingToday": "今天还没记录实际喂食",
  "weight.stale": "距离上次称重已超过 10 天",
  "plan.bcsUnknown": "未记录体况，目标体重仅按用户输入估算",
  "plan.bcsHigh": "建议先与兽医确认目标与热量",
  "plan.lossFast": "下降偏快，请复核喂食量",
  "plan.stalled": "趋势停滞，先核对零食与热量密度",
};

export function getPlanTipMessage(key: PlanTip["messageKey"]): string {
  return messages[key];
}

function hasTodayFeeding(logs: FeedingLog[], today: string): boolean {
  return logs.some(
    (log) => log.date === today && ((log.dryGrams ?? 0) > 0 || (log.wetGrams ?? 0) > 0),
  );
}

function hasFastConsecutiveLoss(logs: WeightLog[]): boolean {
  if (logs.length < 3) return false;
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const intervals = [
    [sorted[0], sorted[1]],
    [sorted[1], sorted[2]],
  ] as const;
  return intervals.every(([current, previous]) => {
    const days = Math.max(1, diffDays(previous.date, current.date));
    const weeklyLossRate =
      ((previous.weightKg - current.weightKg) / previous.weightKg) * (7 / days);
    return weeklyLossRate > 0.01;
  });
}

function hasStalledTrend(
  weightLogs: WeightLog[],
  feedingLogs: FeedingLog[],
  today: string,
): boolean {
  if (weightLogs.length < 2) return false;
  const recentFeedingDays = new Set(
    feedingLogs
      .filter((log) => diffDays(log.date, today) <= 13)
      .filter((log) => (log.dryGrams ?? 0) > 0 || (log.wetGrams ?? 0) > 0)
      .map((log) => log.date),
  );
  if (recentFeedingDays.size < 14) return false;

  const sorted = [...weightLogs].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  const older = sorted.find((log) => diffDays(log.date, latest.date) >= 13);
  return older ? latest.weightKg >= older.weightKg : false;
}

export function getPlanTips(input: PlanTipsInput): PlanTip[] {
  const today = input.today ?? toLocalDateString();
  const tips: PlanTip[] = [];

  if (!hasTodayFeeding(input.feedingLogs, today)) {
    tips.push({ kind: "feeding", messageKey: "feeding.missingToday", priority: 10 });
  }

  const latestWeight = [...input.weightLogs].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (latestWeight && diffDays(latestWeight.date, today) > 10) {
    tips.push({ kind: "weight", messageKey: "weight.stale", priority: 20 });
  }

  const bcsRisk = getBcsRisk(input.pet.bcsScore);
  if (bcsRisk === "high") {
    tips.push({ kind: "plan", messageKey: "plan.bcsHigh", priority: 50 });
  } else if (bcsRisk === "unknown") {
    tips.push({ kind: "plan", messageKey: "plan.bcsUnknown", priority: 30 });
  }

  if (hasFastConsecutiveLoss(input.weightLogs)) {
    tips.push({ kind: "plan", messageKey: "plan.lossFast", priority: 45 });
  } else if (hasStalledTrend(input.weightLogs, input.feedingLogs, today)) {
    tips.push({ kind: "plan", messageKey: "plan.stalled", priority: 40 });
  }

  return tips.sort((a, b) => b.priority - a.priority);
}

export function highestTipForKind(tips: PlanTip[], kind: PlanTipKind): PlanTip | null {
  return tips.find((tip) => tip.kind === kind) ?? null;
}
