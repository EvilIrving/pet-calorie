import { ChevronLeft24Regular, ChevronRight24Regular } from "@fluentui/react-icons";
import { useState } from "react";
import { buildMonthMatrix, shiftMonth } from "../lib/calendar";
import { toLocalDateString } from "../lib/date";
import { vibrateStep } from "../lib/haptics";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

export interface CalendarProps {
  value: string;
  onChange: (iso: string) => void;
  /** 可选最大日期（含），默认今天，禁止选择之后的日期 */
  max?: string;
  "aria-label"?: string;
}

export default function Calendar({
  value,
  onChange,
  max = toLocalDateString(),
  "aria-label": ariaLabel = "选择日期",
}: CalendarProps) {
  const today = toLocalDateString();
  const [view, setView] = useState(() => {
    const [y, m] = value.split("-").map(Number);
    return { year: y, month: m };
  });

  const weeks = buildMonthMatrix(view.year, view.month);
  const canGoNext = `${view.year}-${String(view.month).padStart(2, "0")}` < max.slice(0, 7);

  const goMonth = (delta: number) => setView((v) => shiftMonth(v.year, v.month, delta));

  const handlePick = (iso: string) => {
    if (iso > max) return;
    vibrateStep();
    onChange(iso);
  };

  return (
    <div role="group" aria-label={ariaLabel} className="select-none">
      <div className="mb-1.5 flex items-center justify-between">
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-full text-ink touch-manipulation active:bg-surface"
          aria-label="上个月"
          onClick={() => goMonth(-1)}
        >
          <ChevronLeft24Regular className="size-5" aria-hidden />
        </button>
        <span className="text-base font-semibold text-ink tabular-nums">
          {view.year} 年 {view.month} 月
        </span>
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-full text-ink touch-manipulation active:bg-surface disabled:opacity-30"
          aria-label="下个月"
          disabled={!canGoNext}
          onClick={() => goMonth(1)}
        >
          <ChevronRight24Regular className="size-5" aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs text-muted">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-0.5">
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {weeks.flat().map((cell) => {
          const selected = cell.iso === value;
          const isToday = cell.iso === today;
          const disabled = cell.iso > max;
          return (
            <div key={cell.iso} className="flex justify-center">
              <button
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                aria-label={cell.iso}
                onClick={() => handlePick(cell.iso)}
                className={`flex size-9 items-center justify-center rounded-full text-sm tabular-nums touch-manipulation transition-colors ${
                  selected
                    ? "bg-accent font-semibold text-white"
                    : disabled
                      ? "text-line"
                      : cell.inMonth
                        ? "text-ink active:bg-surface"
                        : "text-muted/50 active:bg-surface"
                } ${isToday && !selected ? "ring-1 ring-accent/50" : ""}`}
              >
                {cell.day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
