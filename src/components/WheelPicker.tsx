import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { vibrateWheel } from "../lib/haptics";

const ROW_HEIGHT = 36;
const VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS;

export interface WheelPickerProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  "aria-label": string;
  step?: number;
  formatValue?: (value: number) => string;
  /** 为 false 时由父级（如 DecimalWheelPicker）提供整组选中条 */
  showSelectionBand?: boolean;
}

export default function WheelPicker({
  min,
  max,
  value,
  onChange,
  "aria-label": ariaLabel,
  step = 1,
  formatValue,
  showSelectionBand = true,
}: WheelPickerProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncingScrollRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  onChangeRef.current = onChange;
  valueRef.current = value;

  const itemCount = Math.floor((max - min) / step) + 1;
  const clampedIndex = Math.min(itemCount - 1, Math.max(0, Math.round((value - min) / step)));
  const clamped = min + clampedIndex * step;

  const syncFromScroll = useCallback(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;
    if (syncingScrollRef.current) return;
    const idx = Math.min(itemCount - 1, Math.max(0, Math.round(wheel.scrollTop / ROW_HEIGHT)));
    const next = min + idx * step;
    const items = wheel.querySelectorAll("[data-wheel-item]");
    items.forEach((el, i) => {
      const active = i === idx;
      el.classList.toggle("text-accent", active);
      el.classList.toggle("scale-[1.12]", active);
      el.classList.toggle("text-muted", !active);
    });
    if (next !== valueRef.current) onChangeRef.current(next);
  }, [min, itemCount, step]);

  useLayoutEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;
    syncingScrollRef.current = true;
    wheel.scrollTo({ top: clampedIndex * ROW_HEIGHT, behavior: "instant" });
    requestAnimationFrame(() => {
      syncingScrollRef.current = false;
    });
  }, [clampedIndex]);

  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncFromScroll);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(() => vibrateWheel(), 120);
    };

    wheel.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      wheel.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, [syncFromScroll]);

  const items: number[] = [];
  for (let i = 0; i < itemCount; i++) items.push(min + i * step);

  return (
    <div className="relative flex-1 min-w-0">
      {showSelectionBand ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-9 -translate-y-1/2 rounded-lg bg-accent/10"
          aria-hidden
        />
      ) : null}
      <div
        ref={wheelRef}
        role="group"
        aria-label={ariaLabel}
        className="relative overflow-y-auto [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [scroll-snap-type:y_mandatory] [mask-image:linear-gradient(to_bottom,transparent,#000_30%,#000_70%,transparent)] text-center [&::-webkit-scrollbar]:hidden"
        style={{ height: WHEEL_HEIGHT }}
      >
        <div style={{ height: ROW_HEIGHT * 2 }} aria-hidden />
        {items.map((n) => (
          <div
            key={n}
            data-wheel-item
            aria-hidden={n !== clamped}
            className={`snap-center text-xl font-semibold tabular-nums transition-[color,transform] duration-150 ${
              n === clamped ? "scale-[1.12] text-accent" : "text-muted"
            }`}
            style={{ height: ROW_HEIGHT, lineHeight: `${ROW_HEIGHT}px` }}
          >
            {formatValue ? formatValue(n) : n}
          </div>
        ))}
        <div style={{ height: ROW_HEIGHT * 2 }} aria-hidden />
      </div>
    </div>
  );
}
