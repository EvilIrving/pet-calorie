import { describe, expect, it } from "vitest";
import { buildMonthMatrix, shiftMonth } from "./calendar";

describe("buildMonthMatrix", () => {
  it("returns a 6×7 grid", () => {
    const grid = buildMonthMatrix(2026, 6);
    expect(grid).toHaveLength(6);
    for (const week of grid) expect(week).toHaveLength(7);
  });

  it("starts on Monday and places the 1st correctly", () => {
    // 2026-06-01 is a Monday → no leading days from previous month
    const grid = buildMonthMatrix(2026, 6);
    expect(grid[0][0]).toMatchObject({ iso: "2026-06-01", day: 1, inMonth: true });
  });

  it("pads with previous-month days when the month starts mid-week", () => {
    // 2026-07-01 is a Wednesday → two leading days from June
    const grid = buildMonthMatrix(2026, 7);
    expect(grid[0][0]).toMatchObject({ iso: "2026-06-29", inMonth: false });
    expect(grid[0][2]).toMatchObject({ iso: "2026-07-01", day: 1, inMonth: true });
  });
});

describe("shiftMonth", () => {
  it("moves forward across a year boundary", () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("moves backward across a year boundary", () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });
});
