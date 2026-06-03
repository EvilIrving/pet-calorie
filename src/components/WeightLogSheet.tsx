import { useState } from "react";
import type { Species } from "../config/nutrition";
import { formatShortDate, toLocalDateString } from "../lib/date";
import Calendar from "./Calendar";
import DecimalWheelPicker from "./DecimalWheelPicker";
import Sheet from "./Sheet";

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
    <Sheet
      title="记录体重"
      subtitle={`${formatShortDate(logDate)} · 建议每周称一次`}
      ariaLabel="记录体重"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-xl bg-surface px-3 py-2 text-sm text-muted touch-manipulation active:bg-line/40"
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            className="min-h-11 flex-1 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white touch-manipulation active:bg-accent-press"
            onClick={() => void onSave(logDate, weightKg)}
          >
            保存
          </button>
        </div>
      }
    >
      <div className="rounded-xl border border-line p-2.5">
        <Calendar value={logDate} max={today} onChange={setLogDate} aria-label="选择称重日期" />
      </div>

      <div className="mt-3">
        <p className="mb-2 text-sm text-muted">体重</p>
        <DecimalWheelPicker
          species={species}
          value={weightKg}
          onChange={setWeightKg}
          aria-label="体重滚轮"
        />
      </div>
    </Sheet>
  );
}
