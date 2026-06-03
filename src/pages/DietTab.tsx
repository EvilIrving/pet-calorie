import { DataTrending24Regular, Scales24Regular, Target24Regular } from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";
import FeedingCard from "../components/FeedingCard";
import FeedingLogSheet from "../components/FeedingLogSheet";
import type { WeightChartPoint } from "../components/WeightChart";
import WeightLogSheet from "../components/WeightLogSheet";
import WeightTrendCard from "../components/WeightTrendCard";
import type { FeedingLog, WeightLog } from "../db";
import { db } from "../db";
import {
  calcDailyGrams,
  calcDietCalorieDeficitRange,
  calcDietDailyKcalRange,
  calcMer,
  calcMixedFeedingPlan,
  calcSafeWeightLossPlan,
} from "../lib/calculator";
import { formatShortDate, toLocalDateString } from "../lib/date";
import { canRecordDry, canRecordWet, summarizeFeeding } from "../lib/feeding";
import { calcDietReferenceWeightKg, summarizeWeightLogs } from "../lib/weightLog";
import { useCatStore } from "../stores/catStore";
import { useFoodStore } from "../stores/foodStore";

function getDietWeek(startIso: string | null): number {
  if (!startIso) return 1;
  const start = new Date(startIso);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1);
}

function formatKcalRange(min: number, max: number): string {
  if (Math.abs(max - min) < 0.05) return `${Math.round(max)}`;
  const roundedMin = Math.round(min);
  const roundedMax = Math.round(max);
  if (roundedMin !== roundedMax) return `${roundedMin}–${roundedMax}`;
  return `${min.toFixed(1)}–${max.toFixed(1)}`;
}

async function loadWeightLogs(): Promise<WeightLog[]> {
  return db.weightLogs.orderBy("date").reverse().toArray();
}

async function loadFeedingLog(date: string): Promise<FeedingLog | null> {
  return (await db.feedingLogs.where("date").equals(date).first()) ?? null;
}

export default function DietTab() {
  const cat = useCatStore((s) => s.cat);
  const updateCat = useCatStore((s) => s.update);
  const foods = useFoodStore((s) => s.foods);
  const [weightSheetOpen, setWeightSheetOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WeightLog | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [feedingSheetOpen, setFeedingSheetOpen] = useState(false);
  const [todayFeeding, setTodayFeeding] = useState<FeedingLog | null>(null);

  const today = toLocalDateString();

  const refreshWeightLogs = () => {
    void loadWeightLogs().then(setWeightLogs);
  };

  const refreshFeeding = () => {
    void loadFeedingLog(today).then(setTodayFeeding);
  };

  useEffect(() => {
    refreshWeightLogs();
  }, []);

  useEffect(() => {
    refreshFeeding();
  }, [today]);

  const species = cat?.species ?? "cat";
  const week = cat ? getDietWeek(cat.dietStartDate) : 1;
  const dietStartWeightKg = cat?.dietStartWeightKg ?? cat?.weightKg ?? 0;
  const idealWeightKg = cat?.idealWeightKg ?? null;
  const referenceWeightKg = calcDietReferenceWeightKg(
    weightLogs,
    cat?.dietStartDate ?? null,
    week,
    dietStartWeightKg,
  );
  const safePlan = calcSafeWeightLossPlan(referenceWeightKg, idealWeightKg, 1, species);
  const progress =
    safePlan.totalWeeksMax > 0
      ? Math.min(100, Math.max(0, (week / safePlan.totalWeeksMax) * 100))
      : 0;
  const mer = cat ? calcMer(cat.weightKg, cat.lifeStage, cat.activity, cat.species) : 0;
  const dailyKcalRange = cat
    ? calcDietDailyKcalRange(mer, referenceWeightKg, safePlan.targetMinKg, safePlan.targetMaxKg)
    : { min: 0, max: 0 };
  const dailyKcal = dailyKcalRange.max;
  const deficitRange = cat
    ? calcDietCalorieDeficitRange(referenceWeightKg, safePlan.targetMinKg, safePlan.targetMaxKg)
    : { min: 0, max: 0 };
  const dryFood = foods.find((f) => f.foodType === "dry");
  const wetFood = foods.find((f) => f.foodType === "wet");
  const hasDryDensity = !!dryFood && dryFood.kcalPerKg > 0;
  const hasWetDensity = !!wetFood && wetFood.kcalPerKg > 0;
  const feedingMode = cat?.feedingMode ?? "dry";
  const recordsDry = canRecordDry(feedingMode);
  const recordsWet = canRecordWet(feedingMode);
  const dryKcalPerKg = dryFood?.kcalPerKg ?? 0;
  const wetKcalPerKg = wetFood?.kcalPerKg ?? 0;
  const mixedDryRatio = cat?.mixedDryRatio ?? 0.5;
  const mixedPlan = calcMixedFeedingPlan(dailyKcal, dryKcalPerKg, wetKcalPerKg, mixedDryRatio);

  const suggestedDryGrams =
    recordsDry && hasDryDensity
      ? Math.round(
          feedingMode === "mixed" ? mixedPlan.dryGrams : calcDailyGrams(dailyKcal, dryKcalPerKg),
        )
      : null;
  const suggestedWetGrams =
    recordsWet && hasWetDensity
      ? Math.round(
          feedingMode === "mixed" ? mixedPlan.wetGrams : calcDailyGrams(dailyKcal, wetKcalPerKg),
        )
      : null;

  const feedingSummary = summarizeFeeding(todayFeeding, dryKcalPerKg, wetKcalPerKg, dailyKcal);

  const saveFeedingLog = async (date: string, dryGrams: number | null, wetGrams: number | null) => {
    const existing = await db.feedingLogs.where("date").equals(date).first();
    if (existing?.id) {
      await db.feedingLogs.update(existing.id, { dryGrams, wetGrams });
    } else {
      await db.feedingLogs.add({ date, dryGrams, wetGrams });
    }
    refreshFeeding();
    setFeedingSheetOpen(false);
  };

  const chartData: WeightChartPoint[] = useMemo(() => {
    if (!weightLogs.length) return [];
    return [...weightLogs].reverse().map((log) => ({
      date: log.date,
      label: formatShortDate(log.date),
      weightKg: log.weightKg,
    }));
  }, [weightLogs]);

  const startDiet = async () => {
    if (!cat) return;
    if (!cat?.dietStartDate) {
      await updateCat({ dietStartDate: new Date().toISOString(), dietStartWeightKg: cat.weightKg });
    }
  };

  const summary = summarizeWeightLogs(weightLogs);
  const latestDate = weightLogs[0]?.date ?? null;

  const openAddSheet = () => {
    setEditingLog(null);
    setWeightSheetOpen(true);
  };

  const openEditSheet = (log: WeightLog) => {
    setEditingLog(log);
    setWeightSheetOpen(true);
  };

  const syncCatToLatest = async () => {
    const latest = await db.weightLogs.orderBy("date").last();
    if (latest) await updateCat({ weightKg: latest.weightKg });
  };

  const saveWeightLog = async (date: string, weightKg: number) => {
    if (!cat) return;
    const existing = await db.weightLogs.where("date").equals(date).first();
    if (existing?.id) {
      await db.weightLogs.update(existing.id, { weightKg });
    } else {
      await db.weightLogs.add({ date, weightKg });
    }
    await syncCatToLatest();
    refreshWeightLogs();
    setWeightSheetOpen(false);
    setEditingLog(null);
  };

  const deleteWeightLog = async (id: number) => {
    await db.weightLogs.delete(id);
    await syncCatToLatest();
    refreshWeightLogs();
  };

  if (!cat) {
    return <p className="py-8 text-center text-sm text-muted">加载中…</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-card bg-card p-4 shadow-sm">
        {!cat.dietStartDate ? (
          <button
            type="button"
            className="mb-3 w-full min-h-11 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white touch-manipulation active:bg-accent-press"
            onClick={startDiet}
          >
            开始减肥计划
          </button>
        ) : null}

        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-ink">第 {week} 周目标</p>
          <p className="text-xs font-medium text-muted">
            固定速率 {(safePlan.rateMin * 100).toFixed(1)}–{(safePlan.rateMax * 100).toFixed(1)}
            %/周
          </p>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-phase-emerald transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Target24Regular className="size-4 text-accent" aria-hidden />
            {formatKcalRange(dailyKcalRange.min, dailyKcalRange.max)} kcal/天
          </span>
          <span className="flex items-center gap-1">
            <Scales24Regular className="size-4 text-accent" aria-hidden />
            {safePlan.targetMinKg.toFixed(2)}–{safePlan.targetMaxKg.toFixed(2)} kg
          </span>
          <span className="flex items-center gap-1">
            <DataTrending24Regular className="size-4 text-accent" aria-hidden />
            MER {Math.round(mer)} · 缺口 {formatKcalRange(deficitRange.min, deficitRange.max)}
          </span>
        </div>
      </section>

      <FeedingCard
        mode={feedingMode}
        hasDryDensity={hasDryDensity}
        hasWetDensity={hasWetDensity}
        suggestedDryGrams={suggestedDryGrams}
        suggestedWetGrams={suggestedWetGrams}
        mixedDryRatio={feedingMode === "mixed" ? mixedDryRatio : null}
        todayLog={todayFeeding}
        summary={feedingSummary}
        onRecord={() => setFeedingSheetOpen(true)}
      />

      <WeightTrendCard
        logs={weightLogs}
        chartData={chartData}
        summary={summary}
        latestDate={latestDate}
        onAdd={openAddSheet}
        onEdit={openEditSheet}
        onDelete={(id) => void deleteWeightLog(id)}
      />

      {weightSheetOpen ? (
        <WeightLogSheet
          species={cat.species}
          initialWeightKg={editingLog?.weightKg ?? summary?.currentKg ?? cat.weightKg}
          initialDate={editingLog?.date ?? toLocalDateString()}
          onClose={() => {
            setWeightSheetOpen(false);
            setEditingLog(null);
          }}
          onSave={saveWeightLog}
        />
      ) : null}

      {feedingSheetOpen ? (
        <FeedingLogSheet
          mode={feedingMode}
          dryKcalPerKg={dryKcalPerKg}
          wetKcalPerKg={wetKcalPerKg}
          targetKcal={dailyKcal}
          initialDryGrams={todayFeeding?.dryGrams ?? (recordsDry ? (suggestedDryGrams ?? 0) : 0)}
          initialWetGrams={todayFeeding?.wetGrams ?? (recordsWet ? (suggestedWetGrams ?? 0) : 0)}
          initialDate={today}
          onClose={() => setFeedingSheetOpen(false)}
          onSave={saveFeedingLog}
        />
      ) : null}
    </div>
  );
}
