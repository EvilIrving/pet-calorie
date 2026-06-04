export type BcsRisk = "unknown" | "thin" | "ideal" | "mild" | "high";

export function getBcsRisk(score: number | null): BcsRisk {
  if (score === null || !Number.isFinite(score)) return "unknown";
  if (score >= 1 && score <= 3) return "thin";
  if (score >= 4 && score <= 5) return "ideal";
  if (score === 6) return "mild";
  if (score >= 7 && score <= 9) return "high";
  return "unknown";
}

export function getBcsCopy(score: number | null): { summary: string; action: string } {
  const risk = getBcsRisk(score);
  if (risk === "thin") {
    return {
      summary: "偏瘦或存在营养风险。",
      action: "目标体重和热量建议先保守评估。",
    };
  }
  if (risk === "ideal") {
    return {
      summary: "体况处于理想范围。",
      action: "可按当前目标继续估算喂食计划。",
    };
  }
  if (risk === "mild") {
    return {
      summary: "轻度超重。",
      action: "目标体重建议逐步调整并持续复盘。",
    };
  }
  if (risk === "high") {
    return {
      summary: "处于高风险减重范围。",
      action: "建议先与兽医确认目标与热量。",
    };
  }
  return {
    summary: "未记录体况评分。",
    action: "减肥计划仍可生成，但目标体重仅按用户输入估算。",
  };
}
