import { useCallback, useEffect, useRef } from "react";
import { vibrateWheel } from "../lib/haptics";

const ROW_HEIGHT = 40;
const VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS;

export interface WheelPickerProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  "aria-label": string;
  /** 为 false 时由父级（如 DecimalWheelPicker）提供整组选中条 */
  showSelectionBand?: boolean;
}

export default function WheelPicker({
  min,
  max,
  value,
  onChange,
  "aria-label": ariaLabel,
  showSelectionBand = true,
}: WheelPickerProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const clamped = Math.min(max, Math.max(min, Math.round(value)));

  const syncFromScroll = useCallback(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;
    const idx = Math.round(wheel.scrollTop / ROW_HEIGHT);
    const next = Math.min(max, Math.max(min, min + idx));
    const items = wheel.querySelectorAll("[data-wheel-item]");
    items.forEach((el, i) => {
      const active = i === idx;
      el.classList.toggle("text-accent", active);
      el.classList.toggle("scale-[1.12]", active);
      el.classList.toggle("text-muted", !active);
    });
    if (next !== value) onChangeRef.current(next);
  }, [min, max, value]);

  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;
    wheel.scrollTop = (clamped - min) * ROW_HEIGHT;
    syncFromScroll();
  }, [clamped, min, syncFromScroll]);

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
  for (let n = min; n <= max; n++) items.push(n);

  return (
    <div className="relative flex-1 min-w-0">
      {showSelectionBand ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-10 -translate-y-1/2 rounded-xl bg-accent/10"
          aria-hidden
        />
      ) : null}
      <div
        ref={wheelRef}
        role="group"
        aria-label={ariaLabel}
        className="relative overflow-y-auto scroll-smooth [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [scroll-snap-type:y_mandatory] [mask-image:linear-gradient(to_bottom,transparent,#000_30%,#000_70%,transparent)] text-center [&::-webkit-scrollbar]:hidden"
        style={{ height: WHEEL_HEIGHT }}
      >
        <div style={{ height: ROW_HEIGHT * 2 }} aria-hidden />
        {items.map((n) => (
          <div
            key={n}
            data-wheel-item
            aria-hidden={n !== clamped}
            className="snap-center text-[22px] font-semibold text-muted tabular-nums transition-[color,transform] duration-150"
            style={{ height: ROW_HEIGHT, lineHeight: `${ROW_HEIGHT}px` }}
          >
            {n}
          </div>
        ))}
        <div style={{ height: ROW_HEIGHT * 2 }} aria-hidden />
      </div>
    </div>
  );
}
