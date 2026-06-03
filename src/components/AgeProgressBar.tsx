import { useCallback, useEffect, useRef } from "react";
import { type AgeBand, petAgeConfig, type Species } from "../config/nutrition";
import {
  clampAgeMonths,
  formatPetAge,
  getAgeBandSegmentWeights,
  monthsToAgeBand,
  monthsToProgress,
  progressToMonths,
} from "../lib/age";
import { vibrateStep } from "../lib/haptics";

export interface AgeProgressBarProps {
  species: Species;
  ageMonths: number;
  onAgeMonthsChange: (months: number) => void;
}

export default function AgeProgressBar({
  species,
  ageMonths,
  onAgeMonthsChange,
}: AgeProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lastBandRef = useRef<AgeBand>(monthsToAgeBand(species, ageMonths));

  useEffect(() => {
    lastBandRef.current = monthsToAgeBand(species, ageMonths);
  }, [species, ageMonths]);

  const cfg = petAgeConfig[species];
  const segmentWeights = getAgeBandSegmentWeights(species);
  const band = monthsToAgeBand(species, ageMonths);
  const progress = monthsToProgress(species, ageMonths);

  const applyProgress = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const months = progressToMonths(species, ratio);
      const newBand = monthsToAgeBand(species, months);
      if (newBand !== lastBandRef.current) {
        vibrateStep();
        lastBandRef.current = newBand;
      }
      onAgeMonthsChange(clampAgeMonths(species, months));
    },
    [species, onAgeMonthsChange],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    applyProgress(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    applyProgress(e.clientX);
  };

  const thumbPercent = `${progress * 100}%`;
  const boundary1 = segmentWeights[0] * 100;
  const boundary2 = (segmentWeights[0] + segmentWeights[1]) * 100;

  return (
    <div className="flex flex-col gap-3">
      <div
        role="slider"
        aria-label="年龄段"
        aria-valuemin={cfg.minMonths}
        aria-valuemax={cfg.maxMonths}
        aria-valuenow={ageMonths}
        aria-valuetext={`${cfg.bandLabels[band]}，${formatPetAge(ageMonths)}`}
        tabIndex={0}
        className="relative touch-none pt-7 pb-4 outline-none focus-visible:ring-2 focus-visible:ring-accent/30 rounded-2xl"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
      >
        <p className="absolute top-0 right-0 text-sm text-muted">{cfg.bandLabels[band]}</p>
        <p className="absolute top-0 left-1/2 -translate-x-1/2 text-base font-semibold text-ink tabular-nums">
          {formatPetAge(ageMonths)}
        </p>

        <div ref={trackRef} className="relative flex h-6 items-center">
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-line/70">
            {/* 由浅入深的进阶渐变：青 → 翠绿 → 翡翠绿 */}
            <div className="absolute inset-0 bg-linear-to-r from-phase-cyan via-phase-emerald to-phase-jade" />
            {/* 未到达部分用半透明遮罩淡化，保留渐变色相 */}
            <div
              className="absolute inset-y-0 right-0 bg-surface/75"
              style={{ left: thumbPercent }}
            />
            {/* 阶段分隔刻度，细微示意三段 */}
            <div
              className="absolute inset-y-0 w-px bg-card/60"
              style={{ left: `${boundary1}%` }}
              aria-hidden
            />
            <div
              className="absolute inset-y-0 w-px bg-card/60"
              style={{ left: `${boundary2}%` }}
              aria-hidden
            />
          </div>

          <div
            className="pointer-events-none absolute top-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-card shadow-[0_2px_8px_rgba(0,0,0,0.18)] ring-1 ring-black/5"
            style={{ left: thumbPercent }}
            aria-hidden
          >
            <span className="size-2.5 rounded-full bg-accent" />
          </div>
        </div>
      </div>
    </div>
  );
}
