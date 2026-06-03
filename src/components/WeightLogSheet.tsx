import { Dismiss24Regular } from "@fluentui/react-icons";
import { useState } from "react";
import type { Species } from "../config/nutrition";
import { formatShortDate, toLocalDateString } from "../lib/date";
import Calendar from "./Calendar";
import DecimalWheelPicker from "./DecimalWheelPicker";

export interface WeightLogSheetProps {
  species: Species;
  initialWeightKg: number;
  initialDate?: string;
  onClose: () => void;
  onSave: (date: string, weightKg: number) => void | Promise<void>;
}

export default function WeightLogSheet({
  species,
  initialWeightKg,
  initialDate = toLocalDateString(),
  onClose,
  onSave,
}: WeightLogSheetProps) {
  const today = toLocalDateString();
  const [weightKg, setWeightKg] = useState(initialWeightKg);
  const [logDate, setLogDate] = useState(initialDate);

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
        aria-label="记录体重"
        className="relative mx-auto w-full max-w-md rounded-t-card bg-card px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.12)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-ink">记录体重</h2>
            <p className="text-xs text-muted">{formatShortDate(logDate)} · 建议每周称一次</p>
          </div>
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
          <Calendar value={logDate} max={today} onChange={setLogDate} aria-label="选择称重日期" />
        </div>

        <div className="mt-4">
          <p className="mb-3 text-sm text-muted">体重</p>
          <DecimalWheelPicker
            species={species}
            value={weightKg}
            onChange={setWeightKg}
            aria-label="体重滚轮"
          />
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
            onClick={() => void onSave(logDate, weightKg)}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
