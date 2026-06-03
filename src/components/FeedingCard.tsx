import { Add20Filled, BowlSalad24Regular } from "@fluentui/react-icons";
import type { FeedingLog } from "../db";
import type { FeedingSummary } from "../lib/feeding";

export interface FeedingCardProps {
  hasDry: boolean;
  hasWet: boolean;
  suggestedDryGrams: number | null;
  suggestedWetGrams: number | null;
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
  hasDry,
  hasWet,
  suggestedDryGrams,
  suggestedWetGrams,
  todayLog,
  summary,
  onRecord,
}: FeedingCardProps) {
  const configured = hasDry || hasWet;

  return (
    <section className="rounded-card bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <h2 className="text-sm font-medium text-muted">今日建议</h2>
        {configured ? (
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
        <FoodRow label="干粮" value={gramsText(hasDry ? suggestedDryGrams : null)} />
        <FoodRow label="湿粮" value={gramsText(hasWet ? suggestedWetGrams : null)} />
      </div>

      {!configured ? (
        <p className="mt-4 py-4 text-center text-sm text-muted">
          先在「热量计算」保存常用猫粮，才能记录实际喂食
        </p>
      ) : (
        <>
          <div className="my-4 h-px bg-line/60" />
          <h3 className="text-sm font-medium text-muted">今日实际</h3>
          {todayLog && summary ? (
            <div className="mt-3 flex flex-col gap-2">
              <FoodRow label="干粮" value={gramsText(hasDry ? todayLog.dryGrams : null)} />
              <FoodRow label="湿粮" value={gramsText(hasWet ? todayLog.wetGrams : null)} />
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
