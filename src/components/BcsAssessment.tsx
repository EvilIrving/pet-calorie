import type { Species } from "../config/nutrition";
import { useI18n } from "../i18n";
import { getBcsRisk } from "../lib/bcs";

export interface BcsAssessmentProps {
  species: Species;
  value: number | null;
  onChange: (value: number | null) => void;
}

const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function BcsAssessment({ species, value, onChange }: BcsAssessmentProps) {
  const { t } = useI18n();
  const risk = getBcsRisk(value);
  const copyKey =
    risk === "thin"
      ? "bcsThin"
      : risk === "ideal"
        ? "bcsIdeal"
        : risk === "mild"
          ? "bcsMild"
          : risk === "high"
            ? "bcsHigh"
            : "bcsUnknown";
  const imageSrc = `${import.meta.env.BASE_URL}bcs/${
    species === "dog" ? "SCR-Dog.png" : "SCR-Cat.png"
  }`;

  return (
    <section className="rounded-xl border border-line bg-card p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">{t("bcsTitle")}</p>
        <button
          type="button"
          className={`min-h-8 rounded-full bg-surface px-2 text-xs font-medium text-muted touch-manipulation active:bg-line/40 ${
            value === null ? "invisible pointer-events-none" : ""
          }`}
          aria-hidden={value === null}
          tabIndex={value === null ? -1 : undefined}
          onClick={() => onChange(null)}
        >
          {t("clear")}
        </button>
      </div>

      <div className="overflow-hidden rounded-lg bg-surface">
        <img
          src={imageSrc}
          alt={t(species === "dog" ? "bcsAltDog" : "bcsAltCat")}
          className="h-auto w-full object-contain"
        />
      </div>

      <div className="mt-2 grid grid-cols-9 gap-1" role="radiogroup" aria-label={t("bcsTitle")}>
        {scores.map((score) => {
          const selected = score === value;
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={selected}
              className="relative flex min-h-11 items-center justify-center rounded-lg bg-surface text-sm font-semibold text-muted tabular-nums touch-manipulation active:bg-line/40"
              onClick={() => onChange(score)}
            >
              {selected ? (
                <span className="absolute inset-0 rounded-lg bg-accent" aria-hidden />
              ) : null}
              <span className={`relative ${selected ? "text-white" : ""}`}>{score}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 rounded-lg bg-surface px-3 py-2">
        <p className="text-xs font-medium text-ink">{t(`${copyKey}Summary`)}</p>
        <p className="mt-0.5 text-xs text-muted">{t(`${copyKey}Action`)}</p>
      </div>
    </section>
  );
}
