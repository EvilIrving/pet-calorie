import { BowlSalad24Regular } from "@fluentui/react-icons";
import { useState } from "react";
import { toLocalDateString } from "../lib/date";
import { calcFeedingKcal, canRecordDry, canRecordWet, type FeedingMode } from "../lib/feeding";
import Calendar from "./Calendar";
import Sheet from "./Sheet";
import Stepper from "./Stepper";

export interface FeedingLogSheetProps {
  mode: FeedingMode;
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

function modeLabel(mode: FeedingMode): string {
  if (mode === "mixed") return "干湿混合";
  if (mode === "dry") return "只喂干粮";
  if (mode === "wet") return "只喂湿粮";
  return "未配置";
}

export default function FeedingLogSheet({
  mode,
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
  const hasDry = canRecordDry(mode);
  const hasWet = canRecordWet(mode);

  const actualKcal = Math.round(
    calcFeedingKcal(
      { dryGrams: hasDry ? dryGrams : null, wetGrams: hasWet ? wetGrams : null },
      dryKcalPerKg,
      wetKcalPerKg,
    ),
  );
  const deltaKcal = actualKcal - Math.round(targetKcal);

  return (
    <Sheet
      title="今日实际喂食"
      ariaLabel="记录今日实际喂食量"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
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
      }
    >
      <p className="mb-3 text-sm font-medium text-accent">{modeLabel(mode)}</p>

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
    </Sheet>
  );
}
