import { BowlSalad24Regular } from "@fluentui/react-icons";
import { useState } from "react";
import { useI18n } from "../i18n";
import { toLocalDateString } from "../lib/date";
import { calcFeedingKcal, canRecordDry, canRecordWet, type FeedingMode } from "../lib/feeding";
import Calendar from "./Calendar";
import Sheet from "./Sheet";
import Stepper from "./Stepper";

export interface FeedingLogSheetProps {
  mode: FeedingMode;
  dryKcalPerKg: number;
  wetKcalPerKg: number;
  targetKcal: number;
  initialDryGrams: number;
  initialWetGrams: number;
  initialDate?: string;
  onClose: () => void;
  onSave: (date: string, dryGrams: number | null, wetGrams: number | null) => void | Promise<void>;
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

function modeLabel(
  mode: FeedingMode,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  if (mode === "mixed") return t("mixedFood");
  if (mode === "dry") return t("dryOnly");
  if (mode === "wet") return t("wetOnly");
  return t("notConfigured");
}

export default function FeedingLogSheet({
  mode,
  dryKcalPerKg,
  wetKcalPerKg,
  targetKcal,
  initialDryGrams,
  initialWetGrams,
  initialDate = toLocalDateString(),
  onClose,
  onSave,
}: FeedingLogSheetProps) {
  const { t } = useI18n();
  const today = toLocalDateString();
  const [dryGrams, setDryGrams] = useState(initialDryGrams);
  const [wetGrams, setWetGrams] = useState(initialWetGrams);
  const [logDate, setLogDate] = useState(initialDate);
  const hasDry = canRecordDry(mode);
  const hasWet = canRecordWet(mode);

  const actualKcal = Math.round(
    calcFeedingKcal(
      { dryGrams: hasDry ? dryGrams : null, wetGrams: hasWet ? wetGrams : null },
      dryKcalPerKg,
      wetKcalPerKg,
    ),
  );
  const deltaKcal = actualKcal - Math.round(targetKcal);

  return (
    <Sheet
      title={t("actualFeeding")}
      ariaLabel={t("recordActualFeeding")}
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
            onClick={() => void onSave(logDate, hasDry ? dryGrams : null, hasWet ? wetGrams : null)}
          >
            {t("save")}
          </button>
        </div>
      }
    >
      <p className="mb-2 text-sm font-medium text-accent">{modeLabel(mode, t)}</p>

      <div className="rounded-xl border border-line p-2.5">
        <Calendar
          value={logDate}
          max={today}
          onChange={setLogDate}
          aria-label={t("chooseFeedingDate")}
        />
      </div>

      {hasDry ? (
        <div className="mt-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-sm text-muted">
            <BowlSalad24Regular className="size-4 text-accent" aria-hidden />
            {t("dryFood")}
          </p>
          <Stepper
            value={dryGrams}
            onChange={setDryGrams}
            step={1}
            min={0}
            max={1000}
            decimals={0}
            unit="g"
            inputMode="numeric"
            aria-label={t("dryGrams")}
          />
        </div>
      ) : null}

      {hasWet ? (
        <div className="mt-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-sm text-muted">
            <BowlSalad24Regular className="size-4 text-accent" aria-hidden />
            {t("wetFood")}
          </p>
          <Stepper
            value={wetGrams}
            onChange={setWetGrams}
            step={1}
            min={0}
            max={1000}
            decimals={0}
            unit="g"
            inputMode="numeric"
            aria-label={t("wetGrams")}
          />
        </div>
      ) : null}

      <div className="mt-3 flex min-h-11 items-center justify-between rounded-xl bg-surface px-3 py-2">
        <span className="text-sm text-muted">{t("actualKcal", { kcal: actualKcal })}</span>
        <span className="text-sm font-medium text-ink">{deltaText(deltaKcal, t)}</span>
      </div>
    </Sheet>
  );
}
