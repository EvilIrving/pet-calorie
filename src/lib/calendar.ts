import { toLocalDateString } from "./date";

export interface CalendarCell {
  iso: string;
  day: number;
  inMonth: boolean;
}

/** 生成某年某月的日历网格（周一为起点，6 行 × 7 列），相邻月份补齐 */
export function buildMonthMatrix(year: number, month: number): CalendarCell[][] {
  const first = new Date(year, month - 1, 1);
  const firstDow = first.getDay();
  const leading = firstDow === 0 ? 6 : firstDow - 1;
  const cursor = new Date(year, month - 1, 1 - leading);

  const weeks: CalendarCell[][] = [];
  for (let w = 0; w < 6; w++) {
    const row: CalendarCell[] = [];
    for (let d = 0; d < 7; d++) {
      row.push({
        iso: toLocalDateString(cursor),
        day: cursor.getDate(),
        inMonth: cursor.getMonth() === month - 1,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(row);
  }
  return weeks;
}

/** 在 [-? , +?] 月偏移后返回新的 { year, month }（month 为 1-12） */
export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const base = new Date(year, month - 1 + delta, 1);
  return { year: base.getFullYear(), month: base.getMonth() + 1 };
}
