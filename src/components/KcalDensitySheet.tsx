import { useState } from "react";
import { energyDensityRange } from "../config/nutrition";
import { useI18n } from "../i18n";
import Sheet from "./Sheet";
import WheelPicker from "./WheelPicker";

export interface KcalDensitySheetProps {
  value: number;
  onChange: (value: number) => void;
  onClose: () => void;
}

export default function KcalDensitySheet({ value, onChange, onClose }: KcalDensitySheetProps) {
  const { t } = useI18n();
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
      title={t("energyDensity")}
      subtitle="kcal/kg"
      ariaLabel={t("selectEnergyDensity")}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-xl bg-surface px-3 py-2 text-sm text-muted touch-manipulation active:bg-line/40"
            onClick={onClose}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            className="min-h-11 flex-1 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white touch-manipulation active:bg-accent-press"
            onClick={handleConfirm}
          >
            {t("confirm")}
          </button>
        </div>
      }
    >
      <div className="rounded-xl border border-line px-3 py-2.5">
        <WheelPicker
          min={energyDensityRange.min}
          max={energyDensityRange.max}
          step={energyDensityRange.step}
          value={draftValue}
          onChange={handleChange}
          formatValue={(n) => `${n} kcal/kg`}
          aria-label={t("energyDensity")}
        />
      </div>
    </Sheet>
  );
}
