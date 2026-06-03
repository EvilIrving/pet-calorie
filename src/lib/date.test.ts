import { describe, expect, it } from "vitest";
import { getLocalWeekKey } from "./date";

describe("getLocalWeekKey", () => {
  it("returns Monday for mid-week dates", () => {
    expect(getLocalWeekKey("2026-06-03")).toBe("2026-06-01");
  });

  it("returns same Monday when input is already Monday", () => {
    expect(getLocalWeekKey("2026-06-01")).toBe("2026-06-01");
  });

  it("rolls Sunday back to previous Monday", () => {
    expect(getLocalWeekKey("2026-06-07")).toBe("2026-06-01");
  });
});
