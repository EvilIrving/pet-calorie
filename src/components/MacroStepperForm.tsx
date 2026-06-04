import { useI18n } from "../i18n";
import { calcMacroAnalysis, type MacroPercents } from "../lib/calculator";
import Stepper from "./Stepper";

const macroFields = [
  ["protein", "protein", 50],
  ["fat", "fat", 30],
  ["ash", "ash", 15],
  ["fiber", "fiber", 15],
  ["moisture", "moisture", 90],
] as const;

export interface MacroStepperFormProps {
  macros: MacroPercents;
  onChange: (macros: MacroPercents) => void;
}

export default function MacroStepperForm({ macros, onChange }: MacroStepperFormProps) {
  const { t } = useI18n();
  const analysis = calcMacroAnalysis(macros);

  return (
    <div className="flex flex-col gap-3">
      {macroFields.map(([key, labelKey, max]) => (
        <div key={key}>
          <p className="mb-1.5 text-sm text-muted">{t(labelKey)} %</p>
          <Stepper
            aria-label={t(labelKey)}
            value={macros[key]}
            onChange={(v) => onChange({ ...macros, [key]: v })}
            step={0.5}
            min={0}
            max={max}
            decimals={1}
            unit="%"
            inputMode="decimal"
          />
        </div>
      ))}

      <div className="rounded-xl bg-surface px-3 py-2.5 text-center text-sm text-muted">
        <p>
          {t("dryMatter")}{" "}
          <span className="font-semibold text-ink">{analysis.dryMatterPercent.toFixed(1)}%</span>
          {" · "}
          NFE <span className="font-semibold text-ink">{analysis.nfePercentAsFed.toFixed(1)}%</span>
          {" · "}
          {t("dryMatterNfe")}{" "}
          <span className="font-semibold text-ink">
            {analysis.nfePercentOnDryMatter.toFixed(1)}%
          </span>
        </p>
        <p className="mt-1">
          <span className="font-semibold text-accent tabular-nums">
            {Math.round(analysis.kcalPerKg)}
          </span>{" "}
          kcal/kg
        </p>
      </div>
    </div>
  );
}
