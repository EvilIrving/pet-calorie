function vibrate(ms: number): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(ms);
  }
}

/** 步进器每次有效变化（对齐 demo-stepper.html） */
export function vibrateStep(): void {
  vibrate(8);
}

/** 滚轮吸附完成（对齐 demo-stepper.html） */
export function vibrateWheel(): void {
  vibrate(6);
}
