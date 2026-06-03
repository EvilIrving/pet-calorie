import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { vibrateWheel } from "../lib/haptics";

const ROW_HEIGHT = 36;
const VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS;
const CENTER_OFFSET = (WHEEL_HEIGHT - ROW_HEIGHT) / 2;

export interface WheelPickerProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  "aria-label": string;
  step?: number;
  formatValue?: (value: number) => string;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);
  const offsetRef = useRef(0);
  const activeIdxRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const selfSyncRef = useRef(false);
  onChangeRef.current = onChange;
  valueRef.current = value;

  const items = useMemo(() => {
    const count = Math.floor((max - min) / step) + 1;
    const arr: number[] = [];
    for (let i = 0; i < count; i++) arr.push(min + i * step);
    return arr;
  }, [min, max, step]);

  const totalCount = items.length;

  const indexByValue = useCallback(
    (v: number) => Math.min(totalCount - 1, Math.max(0, Math.round((v - min) / step))),
    [min, totalCount, step],
  );

  const offsetForIndex = useCallback((idx: number) => CENTER_OFFSET - idx * ROW_HEIGHT, []);

  const indexForOffset = useCallback(
    (off: number) => Math.round((CENTER_OFFSET - off) / ROW_HEIGHT),
    [],
  );

  const maxOffset = offsetForIndex(0);
  const minOffset = offsetForIndex(totalCount - 1);

  const clampOffset = useCallback(
    (off: number, overscroll = 0) => {
      if (off > maxOffset) return overscroll ? maxOffset + (off - maxOffset) * 0.25 : maxOffset;
      if (off < minOffset) return overscroll ? minOffset + (off - minOffset) * 0.25 : minOffset;
      return off;
    },
    [maxOffset, minOffset],
  );

  // --- direct DOM class toggle (avoids full querySelectorAll on every frame) ---
  const switchActiveClass = useCallback((fromIdx: number, toIdx: number) => {
    const btns = containerRef.current?.children[1]?.children;
    if (!btns) return;
    const oldEl = btns[fromIdx] as HTMLElement | undefined;
    const newEl = btns[toIdx] as HTMLElement | undefined;
    if (oldEl) {
      oldEl.classList.remove("text-accent", "scale-[1.12]");
      oldEl.classList.add("text-muted");
    }
    if (newEl) {
      newEl.classList.add("text-accent", "scale-[1.12]");
      newEl.classList.remove("text-muted");
    }
  }, []);

  // --- animate to index ---
  const animateToIndex = useCallback(
    (idx: number, duration: number) => {
      const target = clampOffset(offsetForIndex(idx));
      const from = offsetRef.current;
      animRef.current?.cancel();
      if (Math.abs(from - target) < 0.5) return;

      const prevIdx = activeIdxRef.current;
      switchActiveClass(prevIdx, idx);
      activeIdxRef.current = idx;

      const anim = innerRef.current?.animate(
        { transform: [`translateY(${from}px)`, `translateY(${target}px)`] },
        { duration, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "forwards" },
      );
      if (anim) {
        animRef.current = anim;
        anim.onfinish = () => {
          offsetRef.current = target;
          animRef.current = null;
        };
        offsetRef.current = target;
      }
    },
    [clampOffset, offsetForIndex, switchActiveClass],
  );

  // --- init ---
  useLayoutEffect(() => {
    const idx = indexByValue(value);
    const target = offsetForIndex(idx);
    offsetRef.current = target;
    activeIdxRef.current = idx;
    if (innerRef.current) {
      innerRef.current.style.transform = `translateY(${target}px)`;
    }
    // set initial active class
    const btns = containerRef.current?.children[1]?.children;
    if (btns?.[idx]) {
      (btns[idx] as HTMLElement).classList.add("text-accent", "scale-[1.12]");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- sync external value changes ---
  useEffect(() => {
    if (selfSyncRef.current) {
      selfSyncRef.current = false;
      return;
    }
    const idx = indexByValue(value);
    animateToIndex(idx, 200);
  }, [value, indexByValue, animateToIndex]);

  // ==================== MOUSE WHEEL ====================
  const wheelAccRef = useRef(0);
  const wheelRafRef = useRef(0);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const settleWheel = useCallback(() => {
    const idx = activeIdxRef.current;
    const next = min + idx * step;
    animateToIndex(idx, 150);
    if (next !== valueRef.current) {
      selfSyncRef.current = true;
      onChangeRef.current(next);
    }
    vibrateWheel();
  }, [min, step, animateToIndex]);

  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      animRef.current?.cancel();

      // normalize delta
      let px = e.deltaY;
      if (e.deltaMode === 1) px *= ROW_HEIGHT;
      else if (e.deltaMode === 2) px *= WHEEL_HEIGHT;
      wheelAccRef.current += px;

      // one RAF per frame
      if (wheelRafRef.current) {
        // already scheduled this frame — just reset settle timer
        if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
        wheelTimerRef.current = setTimeout(settleWheel, 150);
        return;
      }

      wheelRafRef.current = requestAnimationFrame(() => {
        wheelRafRef.current = 0;
        const acc = wheelAccRef.current;
        const steps = Math.trunc(acc / ROW_HEIGHT);
        if (steps === 0) return;
        wheelAccRef.current -= steps * ROW_HEIGHT;

        const newIdx = Math.max(0, Math.min(totalCount - 1, activeIdxRef.current + steps));
        if (newIdx === activeIdxRef.current) return;

        switchActiveClass(activeIdxRef.current, newIdx);
        activeIdxRef.current = newIdx;

        const target = offsetForIndex(newIdx);
        offsetRef.current = target;
        if (innerRef.current) {
          innerRef.current.style.transform = `translateY(${target}px)`;
        }
      });

      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(settleWheel, 150);
    },
    [totalCount, offsetForIndex, switchActiveClass, settleWheel],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  // ==================== POINTER DRAG ====================
  const drag = useRef({
    active: false,
    startY: 0,
    startOffset: 0,
    velocities: [] as number[],
    lastY: 0,
    lastTime: 0,
  });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    animRef.current?.cancel();
    containerRef.current?.setPointerCapture(e.pointerId);
    const now = Date.now();
    drag.current = {
      active: true,
      startY: e.clientY,
      startOffset: offsetRef.current,
      velocities: [],
      lastY: e.clientY,
      lastTime: now,
    };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current.active) return;
      const d = drag.current;
      const now = Date.now();
      const raw = d.startOffset + (e.clientY - d.startY);
      const clamped = clampOffset(raw, 40);
      const prevIdx = activeIdxRef.current;
      const newIdx = Math.max(0, Math.min(totalCount - 1, indexForOffset(clamped)));
      offsetRef.current = clamped;
      if (innerRef.current) {
        innerRef.current.style.transform = `translateY(${clamped}px)`;
      }
      if (newIdx !== prevIdx) {
        switchActiveClass(prevIdx, newIdx);
        activeIdxRef.current = newIdx;
      }

      const dt = Math.max(1, now - d.lastTime);
      d.velocities.push((e.clientY - d.lastY) / dt);
      if (d.velocities.length > 5) d.velocities.shift();
      d.lastY = e.clientY;
      d.lastTime = now;
    },
    [clampOffset, totalCount, indexForOffset, switchActiveClass],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current.active) return;
      drag.current.active = false;
      containerRef.current?.releasePointerCapture(e.pointerId);

      const d = drag.current;
      const totalDy = e.clientY - d.startY;
      const totalDt = Date.now() - d.lastTime;

      if (Math.abs(totalDy) < 4 && totalDt < 300) {
        const idx = Math.max(0, Math.min(totalCount - 1, indexForOffset(offsetRef.current)));
        const next = min + idx * step;
        animateToIndex(idx, 200);
        if (next !== valueRef.current) {
          selfSyncRef.current = true;
          onChangeRef.current(next);
        }
        vibrateWheel();
        return;
      }

      const avgVel =
        d.velocities.length > 0 ? d.velocities.reduce((a, b) => a + b, 0) / d.velocities.length : 0;
      const projected = offsetRef.current + avgVel * 120;
      const projectedIdx = Math.max(0, Math.min(totalCount - 1, indexForOffset(projected)));
      const next = min + projectedIdx * step;
      const dur = Math.min(450, Math.max(150, Math.abs(avgVel) * 300));
      animateToIndex(projectedIdx, dur);
      if (next !== valueRef.current) {
        selfSyncRef.current = true;
        onChangeRef.current(next);
      }
      vibrateWheel();
    },
    [min, step, totalCount, indexForOffset, animateToIndex],
  );

  const onPointerCancel = useCallback(() => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const idx = Math.max(0, Math.min(totalCount - 1, indexForOffset(offsetRef.current)));
    animateToIndex(idx, 200);
  }, [totalCount, indexForOffset, animateToIndex]);

  // ==================== CLICK-TO-SELECT ====================
  const handleItemClick = useCallback(
    (n: number) => {
      const idx = indexByValue(n);
      animateToIndex(idx, 250);
      if (n !== valueRef.current) {
        selfSyncRef.current = true;
        onChangeRef.current(n);
      }
      vibrateWheel();
    },
    [indexByValue, animateToIndex],
  );

  // ==================== KEYBOARD ====================
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const nextIdx = Math.max(0, indexByValue(value) - 1);
        const next = min + nextIdx * step;
        if (next !== valueRef.current) {
          selfSyncRef.current = true;
          onChangeRef.current(next);
        }
        animateToIndex(nextIdx, 200);
        vibrateWheel();
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const nextIdx = Math.min(totalCount - 1, indexByValue(value) + 1);
        const next = min + nextIdx * step;
        if (next !== valueRef.current) {
          selfSyncRef.current = true;
          onChangeRef.current(next);
        }
        animateToIndex(nextIdx, 200);
        vibrateWheel();
      }
    },
    [value, min, step, totalCount, indexByValue, animateToIndex],
  );

  return (
    <div className="relative flex-1 min-w-0">
      {showSelectionBand ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-9 -translate-y-1/2 rounded-lg bg-accent/10"
          aria-hidden
        />
      ) : null}
      <div
        ref={containerRef}
        className="relative overflow-hidden touch-none select-none outline-none"
        style={{ height: WHEEL_HEIGHT }}
        role="listbox"
        aria-label={ariaLabel}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onKeyDown={handleKeyDown}
      >
        <div ref={innerRef} className="absolute inset-x-0 will-change-transform" style={{ top: 0 }}>
          {items.map((n) => {
            const isActive = n === value;
            return (
              <button
                key={n}
                type="button"
                role="option"
                aria-selected={isActive}
                data-wheel-item
                className={`block w-full text-center text-xl font-semibold tabular-nums transition-[color,transform] duration-150 ${
                  isActive ? "scale-[1.12] text-accent" : "text-muted"
                }`}
                style={{ height: ROW_HEIGHT, lineHeight: `${ROW_HEIGHT}px` }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick(n);
                }}
              >
                {formatValue ? formatValue(n) : n}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
