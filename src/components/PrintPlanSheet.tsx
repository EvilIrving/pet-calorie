import {
  ArrowSync24Regular,
  Dismiss24Regular,
  Image24Regular,
  Print24Regular,
} from "@fluentui/react-icons";
import { toPng } from "html-to-image";
import { useCallback, useRef, useState } from "react";
import { useI18n } from "../i18n";
import type { PrintPlanData, PrintPlanFoodLine } from "../lib/printPlan";
import { useUnit } from "../unit";
import { DailyChecklist, WeeklyWeightTable } from "./PrintPlanTables";

export interface PrintPlanSheetProps {
  data: PrintPlanData;
  onClose: () => void;
}

function formatKcal(min: number, max: number): string {
  const roundedMin = Math.round(min);
  const roundedMax = Math.round(max);
  return roundedMin === roundedMax ? `${roundedMax}` : `${roundedMin}-${roundedMax}`;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-line border-b pb-2">
      <p className="text-[10px] font-semibold tracking-[0.06em] text-muted uppercase">{label}</p>
      <p className="mt-0.5 text-[14px] font-semibold text-ink tabular-nums">{value}</p>
    </div>
  );
}

function FoodAmount({
  line,
  label,
  fallback,
}: {
  line: PrintPlanFoodLine;
  label: string;
  fallback: string;
}) {
  const value = line.configured && line.grams !== null ? `${line.grams} g` : fallback;
  const density =
    line.configured && line.kcalPerKg !== null ? `${Math.round(line.kcalPerKg)} kcal/kg` : fallback;
  return (
    <tr className="border-line border-b">
      <th className="py-2 pr-2 text-left text-[12px] font-semibold text-ink">{label}</th>
      <td className="px-2 py-2 text-[12px] font-semibold text-ink tabular-nums">{value}</td>
      <td className="py-2 pl-2 text-[11px] text-muted tabular-nums">{density}</td>
    </tr>
  );
}

export default function PrintPlanSheet({ data, onClose }: PrintPlanSheetProps) {
  const { t } = useI18n();
  const { formatWeight } = useUnit();
  const pageRef = useRef<HTMLElement>(null);
  const [capturedPng, setCapturedPng] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const capture = useCallback(async () => {
    if (!pageRef.current) return;
    setCapturing(true);
    setCaptureError(null);
    try {
      await new Promise((r) => requestAnimationFrame(r));
      const dataUrl = await toPng(pageRef.current, {
        pixelRatio: 2,
        backgroundColor: "#fbfbf7",
      });
      setCapturedPng(dataUrl);
    } catch {
      setCaptureError(t("printCaptureFailed"));
    } finally {
      setCapturing(false);
    }
  }, [t]);

  const printWindowRef = useRef<Window | null>(null);

  const printPng = useCallback(() => {
    if (!capturedPng) return;
    printWindowRef.current?.close();
    const w = window.open("", "_blank");
    if (!w) {
      setCaptureError(t("printPopupBlocked"));
      return;
    }
    printWindowRef.current = w;
    w.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{size:A4 portrait;margin:0}html,body{margin:0;background:#fff}img{display:block;width:100%;height:auto}</style></head><body><img src="${capturedPng}"><script>setTimeout(function(){window.print()},400)</script></body></html>`,
    );
    w.document.close();
  }, [capturedPng, t]);

  const bcs = data.bcsScore === null ? t("bcsUnknownSummary") : `${data.bcsScore}/9`;
  const targetWeight =
    data.targetWeightKg === null ? t("notConfigured") : formatWeight(data.targetWeightKg, 1);
  const ratio =
    data.dryRatioPercent === null || data.wetRatioPercent === null
      ? t("notConfigured")
      : t("printDryWetRatioValue", {
          dry: data.dryRatioPercent,
          wet: data.wetRatioPercent,
        });

  return (
    <div className="print-plan-overlay fixed inset-0 z-[70] overflow-auto bg-surface px-3 py-4">
      {/* Toolbar */}
      <div className="print-plan-toolbar sticky top-0 z-10 mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-2 rounded-card bg-card/95 p-2 shadow-sm backdrop-blur">
        <button
          type="button"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full touch-manipulation active:bg-surface"
          aria-label={t("close")}
          onClick={onClose}
        >
          <Dismiss24Regular className="size-6 text-muted" aria-hidden />
        </button>
        <p className="text-sm font-semibold text-ink">{t("printPlanTitle")}</p>
        {capturedPng ? (
          <button
            type="button"
            className="flex min-h-11 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-semibold text-white touch-manipulation active:bg-accent-press"
            onClick={printPng}
          >
            <Print24Regular className="size-5" aria-hidden />
            {t("printNow")}
          </button>
        ) : (
          <button
            type="button"
            className="flex min-h-11 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-semibold text-white touch-manipulation active:bg-accent-press disabled:opacity-50"
            onClick={capture}
            disabled={capturing}
          >
            {capturing ? (
              <ArrowSync24Regular className="size-5 animate-spin" aria-hidden />
            ) : (
              <Image24Regular className="size-5" aria-hidden />
            )}
            {capturing ? t("printCapturing") : t("printGenerate")}
          </button>
        )}
      </div>

      {/* Error */}
      {captureError && (
        <p
          role="alert"
          className="mx-auto mb-3 max-w-[210mm] rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600"
        >
          {captureError}
        </p>
      )}

      {/* PNG preview or DOM preview */}
      {capturedPng ? (
        <img
          src={capturedPng}
          alt={t("printPlanTitle")}
          className="mx-auto block w-[210mm] max-w-full shadow-xl"
        />
      ) : (
        <article
          ref={pageRef}
          className={`print-plan-page mx-auto flex min-h-[297mm] w-[210mm] max-w-full flex-col bg-[#fbfbf7] p-[12mm] text-ink${capturing ? "" : " shadow-xl"}`}
        >
          <header className="break-inside-avoid border-ink border-b-2 pb-3">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-accent uppercase">
              {t("printPlanEyebrow")}
            </p>
            <div className="mt-1 flex items-end justify-between gap-4">
              <div>
                <h1 className="text-[28px] font-bold leading-none">{data.petName}</h1>
                <p className="mt-1 text-[12px] text-muted">
                  {t(data.species)} · {t("printGenerated", { date: data.generatedDate })}
                </p>
              </div>
              <p className="text-right text-[18px] font-bold tabular-nums">
                {formatKcal(data.dailyKcalMin, data.dailyKcalMax)}
                <span className="ml-1 text-[11px] font-semibold text-muted">
                  {t("kcalPerDayUnit")}
                </span>
              </p>
            </div>
          </header>

          <section className="mt-5 grid grid-cols-4 gap-x-4 gap-y-3 break-inside-avoid">
            <Detail label={t("currentWeight")} value={formatWeight(data.currentWeightKg, 1)} />
            <Detail label={t("targetWeight")} value={targetWeight} />
            <Detail label={t("bcsTitle")} value={bcs} />
            <Detail label={t("planStartDate")} value={data.planStartDate} />
            <Detail label={t("currentWeek")} value={String(data.currentWeek)} />
            <Detail
              label={t("weighFrequency")}
              value={t("weighEveryDays", { days: data.weighEveryDays })}
            />
            {data.dryRatioPercent !== null ? (
              <Detail label={t("dryWetRatio")} value={ratio} />
            ) : null}
            <Detail
              label={t("dailyTarget")}
              value={`${formatKcal(data.dailyKcalMin, data.dailyKcalMax)} kcal`}
            />
          </section>

          <section className="mt-5 grid grid-cols-[1fr_1fr] gap-4 break-inside-avoid">
            <div>
              <h2 className="text-[15px] font-bold tracking-tight">{t("feedingPlan")}</h2>
              <table className="mt-2 w-full border-line border-t">
                <thead>
                  <tr className="border-line border-b text-[10px] font-semibold text-muted">
                    <th className="py-1.5 pr-2 text-left">{t("food")}</th>
                    <th className="px-2 py-1.5 text-left">{t("plannedAmount")}</th>
                    <th className="py-1.5 pl-2 text-left">{t("energyDensity")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dryLine.planned ? (
                    <FoodAmount
                      line={data.dryLine}
                      label={t("dryFood")}
                      fallback={t("notConfigured")}
                    />
                  ) : null}
                  {data.wetLine.planned ? (
                    <FoodAmount
                      line={data.wetLine}
                      label={t("wetFood")}
                      fallback={t("notConfigured")}
                    />
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border border-line p-3">
              <h2 className="text-[13px] font-bold">{t("printNotesTitle")}</h2>
              <p className="mt-1.5 text-[11px] leading-snug text-ink">{t("printRiskNote")}</p>
              <p className="mt-1 text-[11px] leading-snug text-muted">{t("printSourceSummary")}</p>
            </div>
          </section>

          <section className="mt-5">
            <DailyChecklist days={data.dailyChecks} />
          </section>

          <WeeklyWeightTable rows={data.weeklyWeights} />

          <footer className="mt-auto border-line border-t pt-2 text-[10px] leading-snug text-muted">
            {t("printVetDisclaimer")}
          </footer>
        </article>
      )}
    </div>
  );
}
