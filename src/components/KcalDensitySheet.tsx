import { useState } from "react";
import { energyDensityRange } from "../config/nutrition";
import Sheet from "./Sheet";
import WheelPicker from "./WheelPicker";

export interface KcalDensitySheetProps {
  value: number;
  onChange: (value: number) => void;
  onClose: () => void;
}

export default function KcalDensitySheet({ value, onChange, onClose }: KcalDensitySheetProps) {
  const [draftValue, setDraftValue] = useState(value);

  const handleChange = (next: number) => {
    setDraftValue(next);
  };

  const handleConfirm = () => {
    onChange(draftValue);
    onClose();
  };

  return (
    <Sheet
      title="热量密度"
      subtitle="kcal/kg"
      ariaLabel="选择热量密度"
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
            onClick={handleConfirm}
          >
            确定
          </button>
        </div>
      }
    >
      <div className="rounded-2xl border border-line px-4 py-3">
        <WheelPicker
          min={energyDensityRange.min}
          max={energyDensityRange.max}
          step={energyDensityRange.step}
          value={draftValue}
          onChange={handleChange}
          formatValue={(n) => `${n} kcal/kg`}
          aria-label="热量密度"
        />
      </div>
    </Sheet>
  );
}
