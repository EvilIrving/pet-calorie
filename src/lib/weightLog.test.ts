import { describe, expect, it } from "vitest";
import type { WeightLog } from "../db";
import { summarizeWeightLogs } from "./weightLog";

const logs: WeightLog[] = [
  { id: 1, date: "2026-06-01", weightKg: 4.5 },
  { id: 2, date: "2026-05-25", weightKg: 4.7 },
];

describe("summarizeWeightLogs", () => {
  it("returns null when there are no logs", () => {
    expect(summarizeWeightLogs([])).toBeNull();
  });

  it("returns current weight with null delta for a single log", () => {
    expect(summarizeWeightLogs([logs[0]])).toEqual({
      currentKg: 4.5,
      previousKg: null,
      deltaKg: null,
    });
  });

  it("computes the delta against the previous log", () => {
    expect(summarizeWeightLogs(logs)).toEqual({
      currentKg: 4.5,
      previousKg: 4.7,
      deltaKg: -0.2,
    });
  });
});
