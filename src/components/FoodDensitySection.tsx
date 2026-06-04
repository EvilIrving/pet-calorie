import { useState } from "react";
import { useI18n } from "../i18n";
import type { MacroPercents } from "../lib/calculator";
import type { FeedingMode } from "../lib/feeding";
import KcalDensitySheet from "./KcalDensitySheet";
import MacroStepperForm from "./MacroStepperForm";
import SegmentControl from "./SegmentControl";

type FoodType = "dry" | "wet";
type InputMode = "kcal" | "macros";
type FeedingPlanMode = Exclude<FeedingMode, "none">;

export interface FoodDensitySectionProps {
  feedingMode: FeedingPlanMode;
  foodType: FoodType;
  inputMode: InputMode;
  kcalPerKg: number;
  dryKcalPerKg: number;
  wetKcalPerKg: number;
  macros: MacroPercents;
  onInputModeChange: (mode: InputMode) => void;
  onDryKcalPerKgChange: (value: number) => void;
  onWetKcalPerKgChange: (value: number) => void;
  onMacrosChange: (macros: MacroPercents) => void;
}

function densityText(value: number) {
  return (
    <span>
      <span className="text-2xl font-bold text-ink tabular-nums">{value}</span>
      <span className="ml-1 text-base font-medium text-muted">kcal/kg</span>
    </span>
  );
}

export default function FoodDensitySection({
  feedingMode,
  foodType,
  inputMode,
  kcalPerKg,
  dryKcalPerKg,
  wetKcalPerKg,
  macros,
  onInputModeChange,
  onDryKcalPerKgChange,
  onWetKcalPerKgChange,
  onMacrosChange,
}: FoodDensitySectionProps) {
  const { t } = useI18n();
  const [densityEditing, setDensityEditing] = useState<FoodType | null>(null);
  const editingValue = densityEditing === "dry" ? dryKcalPerKg : wetKcalPerKg;
  const handleDensityChange =
    densityEditing === "dry" ? onDryKcalPerKgChange : onWetKcalPerKgChange;

  return (
    <section className="rounded-card bg-card p-4 shadow-sm">
      {feedingMode === "mixed" ? (
        <>
          <p className="mb-2 text-sm text-muted">{t("energyDensity")}</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="flex min-h-12 w-full items-baseline justify-between rounded-xl border border-line bg-card px-3 py-2.5 touch-manipulation active:bg-surface"
              aria-label={t("openDryDensity")}
              onClick={() => setDensityEditing("dry")}
            >
              <span className="text-sm font-medium text-muted">{t("dryFood")}</span>
              {densityText(dryKcalPerKg)}
            </button>
            <button
              type="button"
              className="flex min-h-12 w-full items-baseline justify-between rounded-xl border border-line bg-card px-3 py-2.5 touch-manipulation active:bg-surface"
              aria-label={t("openWetDensity")}
              onClick={() => setDensityEditing("wet")}
            >
              <span className="text-sm font-medium text-muted">{t("wetFood")}</span>
              {densityText(wetKcalPerKg)}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-2 text-sm text-muted">{t("energyInputMode")}</p>
          <SegmentControl
            aria-label={t("energyInputMode")}
            options={[
              { value: "kcal", label: "kcal/kg" },
              { value: "macros", label: t("macroEstimate") },
            ]}
            value={inputMode}
            onChange={onInputModeChange}
          />
          <div className="mt-3">
            {inputMode === "kcal" ? (
              <button
                type="button"
                className="flex min-h-12 w-full items-baseline justify-center rounded-xl border border-line bg-card px-3 py-2.5 text-center touch-manipulation active:bg-surface"
                aria-label={t("openDensity")}
                onClick={() => setDensityEditing(foodType)}
              >
                <span className="text-3xl font-bold text-ink tabular-nums">{kcalPerKg}</span>
                <span className="ml-1 text-base font-medium text-muted">kcal/kg</span>
              </button>
            ) : (
              <MacroStepperForm macros={macros} onChange={onMacrosChange} />
            )}
          </div>
        </>
      )}

      {densityEditing ? (
        <KcalDensitySheet
          value={editingValue}
          onChange={handleDensityChange}
          onClose={() => setDensityEditing(null)}
        />
      ) : null}
    </section>
  );
}
