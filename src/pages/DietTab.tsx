import {
  BowlSalad24Regular,
  DataTrending24Regular,
  Scales24Regular,
  Target24Regular,
} from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";
import type { WeightChartPoint } from "../components/WeightChart";
import WeightLogSheet from "../components/WeightLogSheet";
import WeightTrendCard from "../components/WeightTrendCard";
import { type DietPhaseKey, dietPhases } from "../config/nutrition";
import type { WeightLog } from "../db";
import { db } from "../db";
import {
  calcDietDailyKcal,
  calcDietProgressPercent,
  calcMer,
  calcRer,
  getDietPhaseKey,
} from "../lib/calculator";
import { formatShortDate, toLocalDateString } from "../lib/date";
import { summarizeWeightLogs } from "../lib/weightLog";
import { useCatStore } from "../stores/catStore";
import { useFoodStore } from "../stores/foodStore";

const phaseLabels: Record<DietPhaseKey, string> = {
  transition: "过渡控量",
  main: "主控减重",
  intensive: "强化减重",
};

const phaseColors: Record<DietPhaseKey, string> = {
  transition: "bg-phase-cyan",
  main: "bg-phase-emerald",
  intensive: "bg-phase-jade",
};

function getDietWeek(startIso: string | null): number {
  if (!startIso) return 1;
  const start = new Date(startIso);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1);
}

async function loadWeightLogs(): Promise<WeightLog[]> {
  return db.weightLogs.orderBy("date").reverse().toArray();
}

export default function DietTab() {
  const cat = useCatStore((s) => s.cat);
  const updateCat = useCatStore((s) => s.update);
  const foods = useFoodStore((s) => s.foods);
  const [weightSheetOpen, setWeightSheetOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WeightLog | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);

  const refreshWeightLogs = () => {
    void loadWeightLogs().then(setWeightLogs);
  };

  useEffect(() => {
    refreshWeightLogs();
  }, []);

  const species = cat?.species ?? "cat";
  const week = cat ? getDietWeek(cat.dietStartDate) : 1;
  const phaseKey = getDietPhaseKey(week, species);
  const phase = dietPhases[species][phaseKey];
  const progress = calcDietProgressPercent(week, species);

  const dailyKcal = cat ? calcDietDailyKcal(cat.weightKg, week, species) : 0;
  const rer = cat ? calcRer(cat.weightKg) : 0;
  const mer = cat ? calcMer(cat.weightKg, cat.lifeStage, cat.activity, cat.species) : 0;
  const dryFood = foods.find((f) => f.foodType === "dry");
  const wetFood = foods.find((f) => f.foodType === "wet");

  const dryGrams =
    dryFood && dryFood.kcalPerKg > 0 ? Math.round((dailyKcal / dryFood.kcalPerKg) * 1000) : null;
  const wetGrams =
    wetFood && wetFood.kcalPerKg > 0 ? Math.round((dailyKcal / wetFood.kcalPerKg) * 1000) : null;

  const chartData: WeightChartPoint[] = useMemo(() => {
    if (!weightLogs.length) return [];
    return [...weightLogs].reverse().map((log) => ({
      date: log.date,
      label: formatShortDate(log.date),
      weightKg: log.weightKg,
    }));
  }, [weightLogs]);

  const startDiet = async () => {
    if (!cat?.dietStartDate) {
      await updateCat({ dietStartDate: new Date().toISOString() });
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
    return <p className="py-12 text-center text-muted">加载中…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-card bg-card p-5 shadow-sm">
        {!cat.dietStartDate ? (
          <button
            type="button"
            className="mb-4 w-full min-h-11 rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white touch-manipulation active:bg-accent-press"
            onClick={startDiet}
          >
            开始减肥计划
          </button>
        ) : null}

        <p className="text-base font-semibold text-ink">
          第 {phase.weeks[0]}
          {phase.weeks[1] === Number.POSITIVE_INFINITY ? "+" : `–${phase.weeks[1]}`} 周：
          {phaseLabels[phaseKey]}
        </p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface">
          <div
            className={`h-full rounded-full transition-all ${phaseColors[phaseKey]}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 flex gap-2 text-xs">
          {(Object.keys(dietPhases[species]) as DietPhaseKey[]).map((key) => (
            <span
              key={key}
              className={`rounded-full px-2 py-1 ${
                key === phaseKey ? `${phaseColors[key]} text-white` : "bg-surface text-muted"
              }`}
            >
              {phaseLabels[key]}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
          <span className="flex items-center gap-1">
            <Target24Regular className="size-4 text-accent" aria-hidden />
            {Math.round(dailyKcal)} kcal/天
          </span>
          <span className="flex items-center gap-1">
            <Scales24Regular className="size-4 text-accent" aria-hidden />
            {phase.ratio}×RER
          </span>
          <span className="flex items-center gap-1">
            <DataTrending24Regular className="size-4 text-accent" aria-hidden />
            RER {Math.round(rer)} · MER {Math.round(mer)}
          </span>
        </div>
      </section>

      <section className="rounded-card bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-muted">今日喂食量</h2>
        <div className="flex flex-col gap-2 text-base">
          <p className="flex items-center gap-2">
            <BowlSalad24Regular className="size-5 text-accent" aria-hidden />
            干粮 {dryGrams !== null ? `${dryGrams} g` : "— （未配置）"}
          </p>
          <p className="flex items-center gap-2">
            <BowlSalad24Regular className="size-5 text-accent" aria-hidden />
            湿粮 {wetGrams !== null ? `${wetGrams} g` : "— （未配置）"}
          </p>
        </div>
      </section>

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
    </div>
  );
}
