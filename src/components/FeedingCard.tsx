import { Add20Filled, BowlSalad24Regular } from "@fluentui/react-icons";
import type { FeedingLog } from "../db";
import { useI18n } from "../i18n";
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
  tip?: string | null;
  onRecord: () => void;
}

function gramsText(grams: number | null, notConfigured: string): string {
  return grams !== null ? `${grams} g` : `— (${notConfigured})`;
}

function FoodRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-ink">
      <BowlSalad24Regular className="size-5 text-accent" aria-hidden />
      <span className="text-muted">{label}</span>
      <span className="ml-auto font-medium tabular-nums">{value}</span>
    </p>
  );
}

function deltaText(
  deltaKcal: number,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  if (deltaKcal === 0) return t("sameAsPlan");
  return t("comparedPlan", {
    sign: deltaKcal > 0 ? "+" : "−",
    kcal: Math.abs(deltaKcal),
  });
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
  tip,
  onRecord,
}: FeedingCardProps) {
  const { t } = useI18n();
  const hasDry = canRecordDry(mode);
  const hasWet = canRecordWet(mode);
  const canRecord =
    mode === "dry" || mode === "wet"
      ? (hasDry && hasDryDensity) || (hasWet && hasWetDensity)
      : hasDryDensity && hasWetDensity;

  return (
    <section className="rounded-card bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-medium text-muted">{t("dailySuggestion")}</h2>
          {mixedDryRatio !== null ? (
            <p className="mt-1 text-xs text-muted">
              {t("calorieRatio", {
                dry: Math.round(mixedDryRatio * 100),
                wet: Math.round((1 - mixedDryRatio) * 100),
              })}
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
            {t("recordActual")}
          </button>
        ) : null}
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        {hasDry ? (
          <FoodRow
            label={mode === "mixed" ? t("dryReference") : t("dryFood")}
            value={gramsText(suggestedDryGrams, t("notConfigured"))}
          />
        ) : null}
        {hasWet ? (
          <FoodRow
            label={mode === "mixed" ? t("wetReference") : t("wetFood")}
            value={gramsText(suggestedWetGrams, t("notConfigured"))}
          />
        ) : null}
      </div>

      {!canRecord ? (
        <p className="mt-3 py-3 text-center text-sm text-muted">{t("saveDensityFirst")}</p>
      ) : (
        <>
          <div className="my-3 h-px bg-line/60" />
          <h3 className="text-sm font-medium text-muted">{t("actualToday")}</h3>
          {todayLog && summary ? (
            <div className="mt-2 flex flex-col gap-1.5">
              {hasDry ? (
                <FoodRow
                  label={t("dryFood")}
                  value={gramsText(todayLog.dryGrams, t("notConfigured"))}
                />
              ) : null}
              {hasWet ? (
                <FoodRow
                  label={t("wetFood")}
                  value={gramsText(todayLog.wetGrams, t("notConfigured"))}
                />
              ) : null}
              <div className="mt-1 flex items-baseline justify-between">
                <p className="text-xl font-bold leading-none text-ink tabular-nums">
                  {summary.actualKcal}
                  <span className="ml-1 text-base font-medium text-muted">kcal</span>
                </p>
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                  {deltaText(summary.deltaKcal, t)}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-2 py-3 text-center text-sm text-muted">
              {tip ?? t("missingFeedingToday")}
            </p>
          )}
        </>
      )}
    </section>
  );
}
