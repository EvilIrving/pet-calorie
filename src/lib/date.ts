/** 本地日历日期 YYYY-MM-DD */
export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toLocalDateString(date);
}

export function diffDays(fromIsoDate: string, toIsoDate: string): number {
  const [fromY, fromM, fromD] = fromIsoDate.split("-").map(Number);
  const [toY, toM, toD] = toIsoDate.split("-").map(Number);
  const from = Date.UTC(fromY, fromM - 1, fromD);
  const to = Date.UTC(toY, toM - 1, toD);
  return Math.floor((to - from) / 86_400_000);
}

export function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${Number(month)}/${Number(day)}`;
}

/** 以当地时区周一为一周起点，返回该周周一的 YYYY-MM-DD（用作周次键） */
export function getLocalWeekKey(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  return toLocalDateString(date);
}
