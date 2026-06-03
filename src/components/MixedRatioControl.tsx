import Stepper from "./Stepper";

export interface MixedRatioControlProps {
  dryRatio: number;
  onChange: (dryRatio: number) => void;
}

function toPercent(ratio: number): number {
  if (!Number.isFinite(ratio)) return 50;
  return Math.round(Math.min(0.9, Math.max(0.1, ratio)) * 100);
}

export default function MixedRatioControl({ dryRatio, onChange }: MixedRatioControlProps) {
  const dryPercent = toPercent(dryRatio);
  const wetPercent = 100 - dryPercent;

  return (
    <section className="rounded-card bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-end justify-between gap-2">
        <div>
          <p className="text-sm text-muted">干湿热量比例</p>
          <p className="mt-1 text-xs text-muted">按 kcal 分配，不按克重分配</p>
        </div>
        <p className="shrink-0 text-sm font-semibold text-accent tabular-nums">
          {dryPercent}% / {wetPercent}%
        </p>
      </div>
      <Stepper
        value={dryPercent}
        onChange={(value) => onChange(value / 100)}
        step={5}
        min={10}
        max={90}
        decimals={0}
        unit="%"
        inputMode="numeric"
        aria-label="干粮热量占比"
      />
      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>干粮 {dryPercent}%</span>
        <span>湿粮 {wetPercent}%</span>
      </div>
    </section>
  );
}
