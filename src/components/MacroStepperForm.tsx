import { calcMacroAnalysis, type MacroPercents } from "../lib/calculator";
import Stepper from "./Stepper";

const macroFields = [
  ["protein", "蛋白", 50],
  ["fat", "脂肪", 30],
  ["ash", "灰分", 15],
  ["fiber", "纤维", 15],
  ["moisture", "水分", 90],
] as const;

export interface MacroStepperFormProps {
  macros: MacroPercents;
  onChange: (macros: MacroPercents) => void;
}

export default function MacroStepperForm({ macros, onChange }: MacroStepperFormProps) {
  const analysis = calcMacroAnalysis(macros);

  return (
    <div className="flex flex-col gap-4">
      {macroFields.map(([key, label, max]) => (
        <div key={key}>
          <p className="mb-2 text-sm text-muted">{label} %</p>
          <Stepper
            aria-label={label}
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

      <div className="rounded-2xl bg-surface px-4 py-3 text-center text-sm text-muted">
        <p>
          干物质{" "}
          <span className="font-semibold text-ink">{analysis.dryMatterPercent.toFixed(1)}%</span>
          {" · "}
          NFE <span className="font-semibold text-ink">{analysis.nfePercentAsFed.toFixed(1)}%</span>
          {" · "}
          干物NFE{" "}
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
