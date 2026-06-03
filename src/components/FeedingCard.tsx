import { Add20Filled, BowlSalad24Regular } from "@fluentui/react-icons";
import type { FeedingLog } from "../db";
import { canRecordDry, canRecordWet, type FeedingMode, type FeedingSummary } from "../lib/feeding";

export interface FeedingCardProps {
  mode: FeedingMode;
  hasDryDensity: boolean;
  hasWetDensity: boolean;
  suggestedDryGrams: number | null;
  suggestedWetGrams: number | null;
  mixedDryRatio: number | null;
  todayLog: FeedingLog | null;
  summary: FeedingSummary | null;
  onRecord: () => void;
}

function gramsText(grams: number | null): string {
  return grams !== null ? `${grams} g` : "— （未配置）";
}

function FoodRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex items-center gap-2 text-base text-ink">
      <BowlSalad24Regular className="size-5 text-accent" aria-hidden />
      <span className="text-muted">{label}</span>
      <span className="ml-auto font-medium tabular-nums">{value}</span>
    </p>
  );
}

function deltaText(deltaKcal: number): string {
  if (deltaKcal === 0) return "与计划持平";
  return `较计划 ${deltaKcal > 0 ? "+" : "−"}${Math.abs(deltaKcal)} kcal`;
}

export default function FeedingCard({
  mode,
  hasDryDensity,
  hasWetDensity,
  suggestedDryGrams,
  suggestedWetGrams,
  mixedDryRatio,
  todayLog,
  summary,
  onRecord,
}: FeedingCardProps) {
  const hasDry = canRecordDry(mode);
  const hasWet = canRecordWet(mode);
  const canRecord =
    mode === "dry" || mode === "wet"
      ? (hasDry && hasDryDensity) || (hasWet && hasWetDensity)
      : hasDryDensity && hasWetDensity;

  return (
    <section className="rounded-card bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-medium text-muted">今日建议</h2>
          {mixedDryRatio !== null ? (
            <p className="mt-1 text-xs text-muted">
              热量比例 干粮 {Math.round(mixedDryRatio * 100)}% · 湿粮{" "}
              {Math.round((1 - mixedDryRatio) * 100)}%
            </p>
          ) : null}
        </div>
        {canRecord ? (
          <button
            type="button"
            className="flex min-h-9 items-center gap-1 rounded-full bg-accent px-3 text-sm font-medium text-white touch-manipulation active:bg-accent-press"
            onClick={onRecord}
          >
            <Add20Filled className="size-4" aria-hidden />
            记录实际
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {hasDry ? (
          <FoodRow
            label={mode === "mixed" ? "干粮参考" : "干粮"}
            value={gramsText(suggestedDryGrams)}
          />
        ) : null}
        {hasWet ? (
          <FoodRow
            label={mode === "mixed" ? "湿粮参考" : "湿粮"}
            value={gramsText(suggestedWetGrams)}
          />
        ) : null}
      </div>

      {!canRecord ? (
        <p className="mt-4 py-4 text-center text-sm text-muted">
          先在「热量计算」保存当前模式需要的热量密度
        </p>
      ) : (
        <>
          <div className="my-4 h-px bg-line/60" />
          <h3 className="text-sm font-medium text-muted">今日实际</h3>
          {todayLog && summary ? (
            <div className="mt-3 flex flex-col gap-2">
              {hasDry ? <FoodRow label="干粮" value={gramsText(todayLog.dryGrams)} /> : null}
              {hasWet ? <FoodRow label="湿粮" value={gramsText(todayLog.wetGrams)} /> : null}
              <div className="mt-1 flex items-baseline justify-between">
                <p className="text-2xl font-bold leading-none text-ink tabular-nums">
                  {summary.actualKcal}
                  <span className="ml-1 text-base font-medium text-muted">kcal</span>
                </p>
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                  {deltaText(summary.deltaKcal)}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-3 py-4 text-center text-sm text-muted">
              还没记今天喂了多少，点「记录实际」填一笔
            </p>
          )}
        </>
      )}
    </section>
  );
}
