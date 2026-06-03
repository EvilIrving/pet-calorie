import { useCallback, useEffect, useRef, useState } from "react";
import type { Species } from "../config/nutrition";
import { weightRange } from "../config/nutrition";
import { vibrateWheel } from "../lib/haptics";

const STEP_KG = 0.01;
const TICK_GAP_PX = 4;
const RULER_HEIGHT_PX = 92;

export interface WeightRulerPickerProps {
  species: Species;
  value: number;
  onChange: (value: number) => void;
  "aria-label": string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundWeight(value: number): number {
  return Math.round(value * 100) / 100;
}

export default function WeightRulerPicker({
  species,
  value,
  onChange,
  "aria-label": ariaLabel,
}: WeightRulerPickerProps) {
  const range = weightRange[species];
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef(0);
  const valueRef = useRef(value);
  const isScrollingRef = useRef(false);
  const [displayValue, setDisplayValue] = useState(value);
  valueRef.current = value;

  const totalTicks = Math.round((range.max - range.min) / STEP_KG);
  const totalWidth = totalTicks * TICK_GAP_PX;

  const tickToWeight = useCallback(
    (tickIndex: number) =>
      clamp(roundWeight(range.min + tickIndex * STEP_KG), range.min, range.max),
    [range.min, range.max],
  );

  const weightToScrollX = useCallback(
    (w: number) => Math.round((w - range.min) / STEP_KG) * TICK_GAP_PX,
    [range.min],
  );

  const readScrollWeight = useCallback((): number | null => {
    const scroller = scrollRef.current;
    if (!scroller) return null;
    const index = Math.min(totalTicks, Math.max(0, Math.round(scroller.scrollLeft / TICK_GAP_PX)));
    return tickToWeight(index);
  }, [totalTicks, tickToWeight]);

  const draw = useCallback(() => {
    const scroller = scrollRef.current;
    const canvas = canvasRef.current;
    if (!scroller || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = scroller.clientWidth;
    const height = RULER_HEIGHT_PX;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(31, 41, 55, 0.22)";
    ctx.fillStyle = "rgba(31, 41, 55, 0.58)";
    ctx.lineWidth = 1;
    ctx.font = "12px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";

    const centerOffset = width / 2;
    const startIndex = Math.max(0, Math.floor((scroller.scrollLeft - centerOffset) / TICK_GAP_PX));
    const endIndex = Math.min(
      totalTicks,
      Math.ceil((scroller.scrollLeft + width + centerOffset) / TICK_GAP_PX),
    );

    for (let i = startIndex; i <= endIndex; i++) {
      const absoluteX = centerOffset + i * TICK_GAP_PX;
      const x = absoluteX - scroller.scrollLeft;
      const isKg = i % 100 === 0;
      const isTenth = i % 10 === 0;
      const tickHeight = isKg ? 38 : isTenth ? 26 : 14;
      ctx.beginPath();
      ctx.moveTo(x, 36);
      ctx.lineTo(x, 36 + tickHeight);
      ctx.stroke();

      if (isKg) {
        const kg = range.min + i * STEP_KG;
        ctx.fillText(String(Math.round(kg)), x, 92);
      }
    }
  }, [range.min, totalTicks]);

  const syncScrollToValue = useCallback(
    (nextValue: number, behavior: ScrollBehavior = "auto") => {
      const scroller = scrollRef.current;
      if (!scroller) return;
      const next = clamp(roundWeight(nextValue), range.min, range.max);
      const x = weightToScrollX(next);
      isScrollingRef.current = true;
      scroller.scrollTo({ left: x, behavior });
    },
    [range.min, range.max, weightToScrollX],
  );

  const settle = useCallback(() => {
    const next = readScrollWeight();
    if (next === null) return;
    setDisplayValue(next);
    syncScrollToValue(next, "smooth");
    if (next !== valueRef.current) {
      onChange(next);
      vibrateWheel();
    }
  }, [onChange, readScrollWeight, syncScrollToValue]);

  useEffect(() => {
    setDisplayValue(value);
    syncScrollToValue(value);
    draw();
  }, [draw, syncScrollToValue, value]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const handleScroll = () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        draw();
        const next = readScrollWeight();
        if (next !== null) setDisplayValue(next);
      });
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(settle, 140);
    };

    const handleScrollEnd = () => {
      isScrollingRef.current = false;
      settle();
    };

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    scroller.addEventListener("scrollend", handleScrollEnd, { passive: true });
    window.addEventListener("resize", draw);
    return () => {
      scroller.removeEventListener("scroll", handleScroll);
      scroller.removeEventListener("scrollend", handleScrollEnd);
      window.removeEventListener("resize", draw);
      cancelAnimationFrame(frameRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, [draw, readScrollWeight, settle]);

  const handleRulerClick = useCallback(
    (e: React.MouseEvent) => {
      const scroller = scrollRef.current;
      if (!scroller) return;
      const rect = scroller.getBoundingClientRect();
      const clickX = e.clientX - rect.left + scroller.scrollLeft;
      const tickIndex = Math.round(clickX / TICK_GAP_PX);
      const w = tickToWeight(Math.min(totalTicks, Math.max(0, tickIndex)));
      setDisplayValue(w);
      syncScrollToValue(w, "smooth");
      if (w !== valueRef.current) {
        onChange(w);
        vibrateWheel();
      }
    },
    [totalTicks, tickToWeight, syncScrollToValue, onChange],
  );

  return (
    <div
      className="rounded-xl border border-line bg-card px-3 py-3"
      role="group"
      aria-label={ariaLabel}
    >
      <div className="text-center">
        <span className="text-3xl font-bold text-ink tabular-nums">{displayValue.toFixed(2)}</span>
        <span className="ml-1 text-base font-medium text-muted">kg</span>
      </div>
      <div className="relative mt-2">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-accent" />
        <div className="pointer-events-none absolute left-1/2 top-7 z-10 size-3 -translate-x-1/2 rounded-full bg-accent" />
        <div
          ref={scrollRef}
          role="slider"
          tabIndex={0}
          aria-valuenow={displayValue}
          aria-valuemin={range.min}
          aria-valuemax={range.max}
          aria-label={ariaLabel}
          className="overflow-x-auto cursor-pointer [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [mask-image:linear-gradient(to_right,transparent,#000_16%,#000_84%,transparent)] [&::-webkit-scrollbar]:hidden"
          onClick={handleRulerClick}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              e.preventDefault();
              const w = clamp(roundWeight(displayValue - STEP_KG), range.min, range.max);
              setDisplayValue(w);
              syncScrollToValue(w, "smooth");
              onChange(w);
              vibrateWheel();
            } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              e.preventDefault();
              const w = clamp(roundWeight(displayValue + STEP_KG), range.min, range.max);
              setDisplayValue(w);
              syncScrollToValue(w, "smooth");
              onChange(w);
              vibrateWheel();
            }
          }}
        >
          <div
            className="relative"
            style={{ width: `calc(100% + ${totalWidth}px)`, height: RULER_HEIGHT_PX }}
          >
            <canvas ref={canvasRef} className="sticky left-0 top-0 block" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}
