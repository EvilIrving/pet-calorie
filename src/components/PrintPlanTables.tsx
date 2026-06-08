import { useI18n } from "../i18n";
import type { PrintPlanDailyCheck, PrintPlanWeeklyWeightRow } from "../lib/printPlan";
import { useUnit } from "../unit";

export interface DailyChecklistProps {
  days: PrintPlanDailyCheck[];
}

export interface WeeklyWeightTableProps {
  rows: PrintPlanWeeklyWeightRow[];
}

// --- helpers ---

function formatDate(locale: string, isoDate: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(new Date(`${isoDate}T00:00:00`));
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function weekdayNarrow(locale: string): string[] {
  const mon = new Date(2024, 0, 1);
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return fmt.format(d);
  });
}

// --- Calendar ---

interface CalMonth {
  year: number;
  month: number;
  label: string;
  weeks: (number | null)[][];
}

function buildCalendarMonths(days: PrintPlanDailyCheck[], locale: string): CalMonth[] {
  if (days.length === 0) return [];

  const first = new Date(`${days[0].date}T00:00:00`);
  const last = new Date(`${days[days.length - 1].date}T00:00:00`);
  const dateSet = new Set(days.map((d) => d.date));

  const months: CalMonth[] = [];
  let y = first.getFullYear();
  let m = first.getMonth();
  const endY = last.getFullYear();
  const endM = last.getMonth();

  const monthFmt = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  });

  while (y < endY || (y === endY && m <= endM)) {
    const firstDay = new Date(y, m, 1);
    const totalDays = new Date(y, m + 1, 0).getDate();
    const startDow = firstDay.getDay();

    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) {
      cells.push(dateSet.has(isoDate(y, m, d)) ? d : null);
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    months.push({
      year: y,
      month: m,
      label: monthFmt.format(firstDay),
      weeks,
    });

    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }

  return months;
}

function CheckmarkCell() {
  return (
    <span className="mx-auto mt-0.5 block size-[17px] rounded-[2px] border-[1.5px] border-ink/25" />
  );
}

export function DailyChecklist({ days }: DailyChecklistProps) {
  const { locale, t } = useI18n();
  const abbrs = weekdayNarrow(locale);
  const months = buildCalendarMonths(days, locale);

  return (
    <div>
      <h2 className="text-[15px] font-bold tracking-tight">{t("dailyChecklist")}</h2>
      <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-4">
        {months.map((cal) => (
          <div key={`${cal.year}-${cal.month}`} className="break-inside-avoid">
            <h3 className="text-[11px] font-semibold tracking-[0.06em] text-muted uppercase">
              {cal.label}
            </h3>
            <table className="mt-1.5 w-full border-line border-t">
              <thead>
                <tr className="border-line border-b">
                  {abbrs.map((a) => (
                    <th key={a} className="py-1 text-center text-[9px] font-medium text-muted">
                      {a}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cal.weeks.map((week) => {
                  const weekKey = week.find((d) => d !== null) ?? 0;
                  return (
                    <tr
                      key={`${cal.year}-${cal.month}-w${weekKey}`}
                      className="border-line border-b"
                    >
                      {week.map((dayNum, di) => {
                        const cellKey =
                          dayNum !== null
                            ? `${cal.year}-${cal.month}-d${dayNum}`
                            : `${cal.year}-${cal.month}-pad${di}`;
                        return (
                          <td key={cellKey} className="py-1.5 text-center align-top">
                            {dayNum !== null ? (
                              <>
                                <span className="text-[10px] tabular-nums leading-none text-muted">
                                  {dayNum}
                                </span>
                                <CheckmarkCell />
                              </>
                            ) : (
                              <span className="text-[10px]">&nbsp;</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- WeeklyWeightTable ---

export function WeeklyWeightTable({ rows }: WeeklyWeightTableProps) {
  const { locale, t } = useI18n();
  const { formatWeight, unitLabel } = useUnit();
  return (
    <section className="mt-5">
      <h2 className="text-[15px] font-bold tracking-tight">{t("weeklyWeightTable")}</h2>
      <table className="mt-3 w-full border-line border-t">
        <colgroup>
          <col className="w-[7%]" />
          <col className="w-[20%]" />
          <col className="w-[25%]" />
          <col className="w-[40%]" />
          <col className="w-[8%]" />
        </colgroup>
        <thead>
          <tr className="border-line border-b text-[10px] font-semibold text-muted">
            <th className="py-2 pr-1 text-left">{t("week")}</th>
            <th className="px-1 py-2 text-left">{t("date")}</th>
            <th className="px-1 py-2 text-left">{t("targetRange")}</th>
            <th className="px-1 py-2 text-left">
              {t("actualWeightWithUnit", { unit: unitLabel })}
            </th>
            <th className="py-2 pl-1 text-center">{t("complete")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.week} className="border-line border-b text-[12px] break-inside-avoid">
              <td className="py-2.5 pr-1 font-semibold tabular-nums text-muted">{row.week}</td>
              <td className="px-1 py-2.5 tabular-nums">{formatDate(locale, row.weekStartDate)}</td>
              <td className="px-1 py-2.5 tabular-nums">
                {formatWeight(row.targetMinKg, 2)}
                <span className="mx-0.5 text-muted">–</span>
                {formatWeight(row.targetMaxKg, 2)}
              </td>
              <td className="px-1 py-2.5">
                <span className="block border-b-[1.5px] border-ink/15 pt-2">&nbsp;</span>
              </td>
              <td className="py-2.5 pl-1 text-center align-middle">
                <CheckmarkCell />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
