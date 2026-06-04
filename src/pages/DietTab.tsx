import { DataTrending24Regular, Scales24Regular, Target24Regular } from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";
import FeedingCard from "../components/FeedingCard";
import FeedingLogSheet from "../components/FeedingLogSheet";
import type { WeightChartPoint } from "../components/WeightChart";
import WeightLogSheet from "../components/WeightLogSheet";
import WeightTrendCard from "../components/WeightTrendCard";
import type { FeedingLog, WeightLog } from "../db";
import { db } from "../db";
import { useI18n } from "../i18n";
import {
  calcDailyGrams,
  calcDietCalorieDeficitRange,
  calcDietDailyKcalRange,
  calcMer,
  calcMixedFeedingPlan,
  calcSafeWeightLossPlan,
} from "../lib/calculator";
import { formatShortDate, toLocalDateString } from "../lib/date";
import {
  canRecordDry,
  canRecordWet,
  isFoodConfiguredForMode,
  summarizeFeeding,
} from "../lib/feeding";
import { getPlanTips, highestTipForKind, type PlanTip } from "../lib/planTips";
import { calcDietReferenceWeightKg, summarizeWeightLogs } from "../lib/weightLog";
import { useCatStore } from "../stores/catStore";
import { useFoodStore } from "../stores/foodStore";
import { useUnit } from "../unit";

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

async function loadWeightLogs(petId: number): Promise<WeightLog[]> {
  return db.weightLogs.where("petId").equals(petId).reverse().sortBy("date");
}

async function loadFeedingLog(petId: number, date: string): Promise<FeedingLog | null> {
  return (await db.feedingLogs.where("[petId+date]").equals([petId, date]).first()) ?? null;
}

async function loadFeedingLogs(petId: number): Promise<FeedingLog[]> {
  return db.feedingLogs.where("petId").equals(petId).reverse().sortBy("date");
}

export default function DietTab() {
  const { t } = useI18n();
  const { formatWeight } = useUnit();
  const activePet = useCatStore((s) => s.activePet);
  const updateCat = useCatStore((s) => s.update);
  const foods = useFoodStore((s) => s.foods);
  const [weightSheetOpen, setWeightSheetOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WeightLog | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [feedingSheetOpen, setFeedingSheetOpen] = useState(false);
  const [todayFeeding, setTodayFeeding] = useState<FeedingLog | null>(null);
  const [feedingLogs, setFeedingLogs] = useState<FeedingLog[]>([]);

  const today = toLocalDateString();
  const petId = activePet?.id;

  const refreshWeightLogs = () => {
    if (petId == null) return;
    void loadWeightLogs(petId).then(setWeightLogs);
  };

  const refreshFeeding = () => {
    if (petId == null) return;
    void loadFeedingLog(petId, today).then(setTodayFeeding);
    void loadFeedingLogs(petId).then(setFeedingLogs);
  };

  useEffect(() => {
    refreshWeightLogs();
  }, [petId]);

  useEffect(() => {
    refreshFeeding();
  }, [petId, today]);

  const species = activePet?.species ?? "cat";
  const week = activePet ? getDietWeek(activePet.dietStartDate) : 1;
  const dietStartWeightKg = activePet?.dietStartWeightKg ?? activePet?.weightKg ?? 0;
  const idealWeightKg = activePet?.idealWeightKg ?? null;
  const referenceWeightKg = calcDietReferenceWeightKg(
    weightLogs,
    activePet?.dietStartDate ?? null,
    week,
    dietStartWeightKg,
  );
  const safePlan = calcSafeWeightLossPlan(referenceWeightKg, idealWeightKg, 1, species);
  const progress =
    safePlan.totalWeeksMax > 0
      ? Math.min(100, Math.max(0, (week / safePlan.totalWeeksMax) * 100))
      : 0;
  const mer = activePet
    ? calcMer(activePet.weightKg, activePet.lifeStage, activePet.activity, activePet.species)
    : 0;
  const dailyKcalRange = activePet
    ? calcDietDailyKcalRange(mer, referenceWeightKg, safePlan.targetMinKg, safePlan.targetMaxKg)
    : { min: 0, max: 0 };
  const dailyKcal = dailyKcalRange.max;
  const deficitRange = activePet
    ? calcDietCalorieDeficitRange(referenceWeightKg, safePlan.targetMinKg, safePlan.targetMaxKg)
    : { min: 0, max: 0 };
  const dryFood = foods.find((f) => f.foodType === "dry");
  const wetFood = foods.find((f) => f.foodType === "wet");
  const hasDryDensity = !!dryFood && dryFood.kcalPerKg > 0;
  const hasWetDensity = !!wetFood && wetFood.kcalPerKg > 0;
  const feedingMode = activePet?.feedingMode ?? "dry";
  const hasFoodConfig =
    feedingMode !== "none" ? isFoodConfiguredForMode(feedingMode, foods) : false;
  const hasOverweightBcs = (activePet?.bcsScore ?? 0) > 5;
  const canStartDiet = hasFoodConfig && hasOverweightBcs;
  const recordsDry = canRecordDry(feedingMode);
  const recordsWet = canRecordWet(feedingMode);
  const dryKcalPerKg = dryFood?.kcalPerKg ?? 0;
  const wetKcalPerKg = wetFood?.kcalPerKg ?? 0;
  const mixedDryRatio = activePet?.mixedDryRatio ?? 0.5;
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
  const planTips = activePet
    ? getPlanTips({
        pet: activePet,
        weightLogs,
        feedingLogs,
        targetKcal: dailyKcal,
        today,
      })
    : [];
  const planTip = highestTipForKind(planTips, "plan");
  const feedingTip = highestTipForKind(planTips, "feeding");
  const weightTip = highestTipForKind(planTips, "weight");
  const tipText = (tip: PlanTip | null): string | null => {
    if (!tip) return null;
    const keyMap: Record<PlanTip["messageKey"], string> = {
      "feeding.missingToday": "missingFeedingToday",
      "weight.stale": "planTipWeightStale",
      "plan.bcsUnknown": "planTipBcsUnknown",
      "plan.bcsHigh": "planTipBcsHigh",
      "plan.lossFast": "planTipLossFast",
      "plan.stalled": "planTipStalled",
    };
    return t(keyMap[tip.messageKey]);
  };

  const saveFeedingLog = async (date: string, dryGrams: number | null, wetGrams: number | null) => {
    if (petId == null) return;
    const existing = await db.feedingLogs.where("[petId+date]").equals([petId, date]).first();
    if (existing?.id) {
      await db.feedingLogs.update(existing.id, { dryGrams, wetGrams });
    } else {
      await db.feedingLogs.add({ petId, date, dryGrams, wetGrams });
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
    if (!activePet) return;
    if (!canStartDiet) return;
    if (!activePet?.dietStartDate) {
      await updateCat({
        dietStartDate: new Date().toISOString(),
        dietStartWeightKg: activePet.weightKg,
      });
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
    if (petId == null) return;
    const latest = await db.weightLogs.where("petId").equals(petId).last();
    if (latest) await updateCat({ weightKg: latest.weightKg });
  };

  const saveWeightLog = async (date: string, weightKg: number) => {
    if (!activePet || petId == null) return;
    const existing = await db.weightLogs.where("[petId+date]").equals([petId, date]).first();
    if (existing?.id) {
      await db.weightLogs.update(existing.id, { weightKg });
    } else {
      await db.weightLogs.add({ petId, date, weightKg });
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

  if (!activePet) {
    return <p className="py-8 text-center text-sm text-muted">{t("loading")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-card bg-card p-4 shadow-sm">
        {!activePet.dietStartDate ? (
          <div className="mb-3">
            <button
              type="button"
              className="w-full min-h-11 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white touch-manipulation active:bg-accent-press disabled:bg-line disabled:text-muted"
              disabled={!canStartDiet}
              onClick={startDiet}
            >
              {t("startDiet")}
            </button>
            {!canStartDiet ? (
              <p className="mt-2 text-xs font-medium text-muted">{t("startDietNeedsFoodAndBcs")}</p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-ink">{t("weekTarget", { week })}</p>
          <p className="text-xs font-medium text-muted">
            {t("fixedRate", {
              min: (safePlan.rateMin * 100).toFixed(1),
              max: (safePlan.rateMax * 100).toFixed(1),
            })}
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
            {t("kcalPerDay", {
              kcal: formatKcalRange(dailyKcalRange.min, dailyKcalRange.max),
            })}
          </span>
          <span className="flex items-center gap-1">
            <Scales24Regular className="size-4 text-accent" aria-hidden />
            {formatWeight(safePlan.targetMinKg, 2)}–{formatWeight(safePlan.targetMaxKg, 2)}
          </span>
          <span className="flex items-center gap-1">
            <DataTrending24Regular className="size-4 text-accent" aria-hidden />
            {t("merDeficit", {
              mer: Math.round(mer),
              deficit: formatKcalRange(deficitRange.min, deficitRange.max),
            })}
          </span>
        </div>
        {planTip ? (
          <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs font-medium text-accent">
            {tipText(planTip)}
          </p>
        ) : null}
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
        tip={tipText(feedingTip)}
        onRecord={() => setFeedingSheetOpen(true)}
      />

      <WeightTrendCard
        logs={weightLogs}
        chartData={chartData}
        summary={summary}
        latestDate={latestDate}
        tip={tipText(weightTip)}
        onAdd={openAddSheet}
        onEdit={openEditSheet}
        onDelete={(id) => void deleteWeightLog(id)}
      />

      {weightSheetOpen ? (
        <WeightLogSheet
          species={activePet.species}
          initialWeightKg={editingLog?.weightKg ?? summary?.currentKg ?? activePet.weightKg}
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
