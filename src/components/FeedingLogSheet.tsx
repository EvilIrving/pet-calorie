import { BowlSalad24Regular, Dismiss24Regular } from "@fluentui/react-icons";
import { useState } from "react";
import { toLocalDateString } from "../lib/date";
import { calcFeedingKcal } from "../lib/feeding";
import Calendar from "./Calendar";
import Stepper from "./Stepper";

export interface FeedingLogSheetProps {
  hasDry: boolean;
  hasWet: boolean;
  dryKcalPerKg: number;
  wetKcalPerKg: number;
  targetKcal: number;
  initialDryGrams: number;
  initialWetGrams: number;
  initialDate?: string;
  onClose: () => void;
  onSave: (date: string, dryGrams: number | null, wetGrams: number | null) => void | Promise<void>;
}

function deltaText(deltaKcal: number): string {
  if (deltaKcal === 0) return "与计划持平";
  return `较计划 ${deltaKcal > 0 ? "+" : "−"}${Math.abs(deltaKcal)} kcal`;
}

export default function FeedingLogSheet({
  hasDry,
  hasWet,
  dryKcalPerKg,
  wetKcalPerKg,
  targetKcal,
  initialDryGrams,
  initialWetGrams,
  initialDate = toLocalDateString(),
  onClose,
  onSave,
}: FeedingLogSheetProps) {
  const today = toLocalDateString();
  const [dryGrams, setDryGrams] = useState(initialDryGrams);
  const [wetGrams, setWetGrams] = useState(initialWetGrams);
  const [logDate, setLogDate] = useState(initialDate);

  const actualKcal = Math.round(
    calcFeedingKcal(
      { dryGrams: hasDry ? dryGrams : null, wetGrams: hasWet ? wetGrams : null },
      dryKcalPerKg,
      wetKcalPerKg,
    ),
  );
  const deltaKcal = actualKcal - Math.round(targetKcal);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        aria-label="关闭"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="记录今日实际喂食量"
        className="relative mx-auto w-full max-w-md rounded-t-card bg-card px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.12)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">今日实际喂食</h2>
          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full touch-manipulation active:bg-surface"
            aria-label="关闭"
            onClick={onClose}
          >
            <Dismiss24Regular className="size-6 text-muted" aria-hidden />
          </button>
        </div>

        <div className="rounded-2xl border border-line p-3">
          <Calendar value={logDate} max={today} onChange={setLogDate} aria-label="选择喂食日期" />
        </div>

        {hasDry ? (
          <div className="mt-4">
            <p className="mb-2 flex items-center gap-1.5 text-sm text-muted">
              <BowlSalad24Regular className="size-4 text-accent" aria-hidden />
              干粮
            </p>
            <Stepper
              value={dryGrams}
              onChange={setDryGrams}
              step={1}
              min={0}
              max={1000}
              decimals={0}
              unit="g"
              inputMode="numeric"
              aria-label="干粮克数"
            />
          </div>
        ) : null}

        {hasWet ? (
          <div className="mt-4">
            <p className="mb-2 flex items-center gap-1.5 text-sm text-muted">
              <BowlSalad24Regular className="size-4 text-accent" aria-hidden />
              湿粮
            </p>
            <Stepper
              value={wetGrams}
              onChange={setWetGrams}
              step={1}
              min={0}
              max={1000}
              decimals={0}
              unit="g"
              inputMode="numeric"
              aria-label="湿粮克数"
            />
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
          <span className="text-sm text-muted">实际 {actualKcal} kcal</span>
          <span className="text-sm font-medium text-ink">{deltaText(deltaKcal)}</span>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-2xl bg-surface px-4 py-3 text-sm text-muted touch-manipulation active:bg-line/40"
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            className="min-h-11 flex-1 rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white touch-manipulation active:bg-accent-press"
            onClick={() => void onSave(logDate, hasDry ? dryGrams : null, hasWet ? wetGrams : null)}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
