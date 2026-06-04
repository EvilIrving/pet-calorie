import { describe, expect, it } from "vitest";
import { getBcsRisk } from "./bcs";

describe("getBcsRisk", () => {
  it("maps missing and invalid scores to unknown", () => {
    expect(getBcsRisk(null)).toBe("unknown");
    expect(getBcsRisk(0)).toBe("unknown");
    expect(getBcsRisk(10)).toBe("unknown");
  });

  it("maps BCS score ranges", () => {
    expect(getBcsRisk(1)).toBe("thin");
    expect(getBcsRisk(3)).toBe("thin");
    expect(getBcsRisk(4)).toBe("ideal");
    expect(getBcsRisk(5)).toBe("ideal");
    expect(getBcsRisk(6)).toBe("mild");
    expect(getBcsRisk(7)).toBe("high");
    expect(getBcsRisk(9)).toBe("high");
  });
});
