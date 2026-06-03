import { Add28Regular, Subtract28Regular } from "@fluentui/react-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { vibrateStep } from "../lib/haptics";

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  decimals?: number;
  unit?: string;
  inputMode?: "decimal" | "numeric";
  "aria-label"?: string;
}

const HOLD_DELAY_MS = 400;
const HOLD_SPEED_START_MS = 120;
const HOLD_SPEED_MIN_MS = 40;
const HOLD_SPEED_STEP_MS = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatValue(value: number, decimals: number): string {
  return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
}

function parseInput(raw: string, decimals: number): number | null {
  const trimmed = raw.trim().replace(/,/g, ".");
  if (trimmed === "" || trimmed === "-" || trimmed === ".") return null;
  const n = Number(trimmed);
  if (Number.isNaN(n)) return null;
  return roundTo(n, decimals);
}

function sanitizeDraft(raw: string): string {
  return raw.replace(/[^\d.]/g, "");
}

export default function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  decimals = 0,
  unit,
  inputMode = "decimal",
  "aria-label": ariaLabel,
}: StepperProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(formatValue(value, decimals));
  const holdDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTickRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdSpeedRef = useRef(HOLD_SPEED_START_MS);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    if (!editing) setDraft(formatValue(value, decimals));
  }, [value, decimals, editing]);

  const applyDelta = useCallback(
    (delta: number) => {
      const current = valueRef.current;
      const next = clamp(roundTo(current + delta * step, decimals), min, max);
      if (next !== current) {
        vibrateStep();
        onChange(next);
      }
    },
    [onChange, step, min, max, decimals],
  );

  const clearHold = useCallback(() => {
    if (holdDelayRef.current) clearTimeout(holdDelayRef.current);
    if (holdTickRef.current) clearTimeout(holdTickRef.current);
    holdDelayRef.current = null;
    holdTickRef.current = null;
    holdSpeedRef.current = HOLD_SPEED_START_MS;
  }, []);

  const scheduleHoldTick = useCallback(
    (delta: number) => {
      holdTickRef.current = setTimeout(() => {
        applyDelta(delta);
        holdSpeedRef.current = Math.max(
          HOLD_SPEED_MIN_MS,
          holdSpeedRef.current - HOLD_SPEED_STEP_MS,
        );
        scheduleHoldTick(delta);
      }, holdSpeedRef.current);
    },
    [applyDelta],
  );

  const startHold = useCallback(
    (delta: number) => {
      applyDelta(delta);
      holdSpeedRef.current = HOLD_SPEED_START_MS;
      holdDelayRef.current = setTimeout(() => {
        scheduleHoldTick(delta);
      }, HOLD_DELAY_MS);
    },
    [applyDelta, scheduleHoldTick],
  );

  const commitDraft = () => {
    setEditing(false);
    const parsed = parseInput(draft, decimals);
    if (parsed === null) {
      setDraft(formatValue(value, decimals));
      return;
    }
    const next = clamp(parsed, min, max);
    if (next !== value) vibrateStep();
    onChange(next);
    setDraft(formatValue(next, decimals));
  };

  const handleDraftChange = (raw: string) => {
    setDraft(sanitizeDraft(raw));
  };

  const atMin = value <= min;
  const atMax = value >= max;
  const ch = Math.max(draft.length, 1);

  return (
    <div
      className="grid grid-cols-[56px_minmax(0,1fr)_56px] items-center gap-3.5"
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="flex size-14 shrink-0 items-center justify-center rounded-[18px] bg-[#f0f2f5] text-accent transition-transform duration-75 active:scale-[0.92] active:bg-accent active:text-white disabled:opacity-35 touch-manipulation [&_svg]:pointer-events-none"
        aria-label="减少"
        disabled={atMin}
        onPointerDown={(e) => {
          e.preventDefault();
          startHold(-1);
        }}
        onPointerUp={clearHold}
        onPointerLeave={clearHold}
        onPointerCancel={clearHold}
      >
        <Subtract28Regular className="size-7" aria-hidden />
      </button>

      <div className="min-w-0 pb-1">
        <div className="flex w-full items-baseline justify-center gap-1">
          <input
            type="text"
            inputMode={inputMode}
            enterKeyHint="done"
            className="no-spin max-w-full border-0 bg-transparent text-center text-[40px] font-bold tracking-tight text-ink outline-none tabular-nums"
            style={{ width: `${ch}ch` }}
            value={draft}
            aria-label={ariaLabel ?? "数值"}
            onFocus={() => setEditing(true)}
            onChange={(e) => handleDraftChange(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
          />
          {unit ? (
            <span className="translate-y-0.5 text-[15px] font-medium whitespace-nowrap text-muted">
              {unit}
            </span>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        className="flex size-14 shrink-0 items-center justify-center rounded-[18px] bg-[#f0f2f5] text-accent transition-transform duration-75 active:scale-[0.92] active:bg-accent active:text-white disabled:opacity-35 touch-manipulation [&_svg]:pointer-events-none"
        aria-label="增加"
        disabled={atMax}
        onPointerDown={(e) => {
          e.preventDefault();
          startHold(1);
        }}
        onPointerUp={clearHold}
        onPointerLeave={clearHold}
        onPointerCancel={clearHold}
      >
        <Add28Regular className="size-7" aria-hidden />
      </button>
    </div>
  );
}
