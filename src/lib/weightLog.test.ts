import { describe, expect, it } from "vitest";
import type { WeightLog } from "../db";
import { calcDietReferenceWeightKg, summarizeWeightLogs } from "./weightLog";

const logs: WeightLog[] = [
  { id: 1, petId: 1, date: "2026-06-01", weightKg: 4.5 },
  { id: 2, petId: 1, date: "2026-05-25", weightKg: 4.7 },
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

describe("calcDietReferenceWeightKg", () => {
  it("uses the start weight for week 1", () => {
    expect(calcDietReferenceWeightKg(logs, "2026-05-25T00:00:00.000Z", 1, 4.8)).toBe(4.8);
  });

  it("uses the previous plan week average from weight logs", () => {
    const weeklyLogs: WeightLog[] = [
      { petId: 1, date: "2026-06-02", weightKg: 5.4 },
      { petId: 1, date: "2026-06-04", weightKg: 5.5 },
      { petId: 1, date: "2026-06-09", weightKg: 5.3 },
    ];
    expect(calcDietReferenceWeightKg(weeklyLogs, "2026-06-01T00:00:00.000Z", 2, 5.6)).toBeCloseTo(
      5.45,
      2,
    );
  });

  it("falls back to the start weight when the previous plan week has no logs", () => {
    expect(calcDietReferenceWeightKg(logs, "2026-06-02T00:00:00.000Z", 3, 5.6)).toBe(5.6);
  });
});
