import {
  Add20Filled,
  ArrowDown16Filled,
  ArrowUp16Filled,
  ChevronDown20Regular,
  Delete16Regular,
} from "@fluentui/react-icons";
import { useState } from "react";
import type { WeightLog } from "../db";
import { formatShortDate } from "../lib/date";
import type { WeightSummary } from "../lib/weightLog";
import WeightChart, { type WeightChartPoint } from "./WeightChart";

export interface WeightTrendCardProps {
  logs: WeightLog[];
  chartData: WeightChartPoint[];
  summary: WeightSummary | null;
  latestDate: string | null;
  onAdd: () => void;
  onEdit: (log: WeightLog) => void;
  onDelete: (id: number) => void;
}

function DeltaBadge({ deltaKg }: { deltaKg: number }) {
  if (deltaKg === 0) {
    return <span className="text-xs font-medium text-muted">较上次持平</span>;
  }
  const down = deltaKg < 0;
  const Icon = down ? ArrowDown16Filled : ArrowUp16Filled;
  return (
    <span
      className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
        down ? "bg-accent/10 text-accent" : "bg-surface text-muted"
      }`}
    >
      <Icon className="size-3.5" aria-hidden />
      {Math.abs(deltaKg).toFixed(1)} kg
    </span>
  );
}

export default function WeightTrendCard({
  logs,
  chartData,
  summary,
  latestDate,
  onAdd,
  onEdit,
  onDelete,
}: WeightTrendCardProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <section className="rounded-card bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <h2 className="text-sm font-medium text-muted">体重记录</h2>
        <button
          type="button"
          className="flex min-h-9 items-center gap-1 rounded-full bg-accent px-3 text-sm font-medium text-white touch-manipulation active:bg-accent-press"
          onClick={onAdd}
        >
          <Add20Filled className="size-4" aria-hidden />
          记录
        </button>
      </div>

      {summary ? (
        <>
          <div className="mt-2 flex items-end gap-2">
            <p className="text-3xl font-bold leading-none text-ink tabular-nums">
              {summary.currentKg.toFixed(1)}
              <span className="ml-1 text-base font-medium text-muted">kg</span>
            </p>
            {summary.deltaKg !== null ? <DeltaBadge deltaKg={summary.deltaKg} /> : null}
          </div>
          {latestDate ? (
            <p className="mt-1 text-xs text-muted">最近称重 {formatShortDate(latestDate)}</p>
          ) : null}

          <div className="mt-3">
            <WeightChart data={chartData} />
          </div>

          <button
            type="button"
            className="mt-2 flex w-full min-h-11 items-center justify-between rounded-xl bg-surface px-3 py-2 text-sm text-muted touch-manipulation active:bg-line/30"
            aria-expanded={historyOpen}
            onClick={() => setHistoryOpen((o) => !o)}
          >
            <span>历史记录（{logs.length}）</span>
            <ChevronDown20Regular
              className={`size-5 transition-transform ${historyOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          {historyOpen ? (
            <ul className="mt-2 flex flex-col divide-y divide-line/60">
              {logs.map((log) => (
                <li key={log.id} className="flex items-center justify-between py-2">
                  <button
                    type="button"
                    className="flex-1 text-left text-sm text-ink touch-manipulation"
                    onClick={() => onEdit(log)}
                  >
                    {formatShortDate(log.date)}
                  </button>
                  <span className="mr-3 text-sm font-medium text-ink tabular-nums">
                    {log.weightKg.toFixed(1)} kg
                  </span>
                  <button
                    type="button"
                    className="flex size-9 items-center justify-center rounded-full text-muted touch-manipulation active:bg-surface"
                    aria-label={`删除 ${formatShortDate(log.date)} 的记录`}
                    onClick={() => log.id !== undefined && onDelete(log.id)}
                  >
                    <Delete16Regular className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <p className="mt-3 py-4 text-center text-sm text-muted">
          还没有体重记录，点「记录」开始追踪吧
        </p>
      )}
    </section>
  );
}
