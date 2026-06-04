import { useEffect, useState } from "react";
import type { ActivityLevel, LifeStage, Species } from "../config/nutrition";
import { activityLabelsBySpecies, defaultPetName, weightRange } from "../config/nutrition";
import type { CatProfile } from "../db";
import { useI18n } from "../i18n";
import { clampAgeMonths, lifeStageToMonths, monthsToLifeStage } from "../lib/age";
import AgeProgressBar from "./AgeProgressBar";
import BcsAssessment from "./BcsAssessment";
import DecimalWheelPicker from "./DecimalWheelPicker";
import SegmentControl from "./SegmentControl";

export interface PetProfileFormValues {
  species: Species;
  name: string;
  weightKg: number;
  idealWeightKg: number | null;
  bcsScore: number | null;
  bcsAssessedAt: string | null;
  lifeStage: LifeStage;
  neutered: boolean;
  activity: ActivityLevel;
}

export interface PetProfileFormProps {
  initial: CatProfile;
  submitLabel: string;
  onSubmit: (values: PetProfileFormValues) => void | Promise<void>;
  /** 设置页：已完成引导的宠物可删除全部数据 */
  onDelete?: () => void | Promise<void>;
  deleteLabel?: string;
}

function clampWeight(species: Species, kg: number): number {
  const { min, max } = weightRange[species];
  return Math.min(max, Math.max(min, kg));
}

export default function PetProfileForm({
  initial,
  submitLabel,
  onSubmit,
  onDelete,
  deleteLabel,
}: PetProfileFormProps) {
  const { t } = useI18n();
  const [species, setSpecies] = useState<Species>(initial.species);
  const [name, setName] = useState(initial.name);
  const [weightKg, setWeightKg] = useState(initial.weightKg);
  const [idealWeightKg, setIdealWeightKg] = useState(initial.idealWeightKg ?? initial.weightKg);
  const [bcsScore, setBcsScore] = useState<number | null>(initial.bcsScore);
  const [ageMonths, setAgeMonths] = useState(() =>
    lifeStageToMonths(initial.species, initial.lifeStage),
  );
  const [neutered, setNeutered] = useState(initial.neutered);
  const [activity, setActivity] = useState<ActivityLevel>(initial.activity);

  const lifeStage = monthsToLifeStage(species, ageMonths, neutered);

  useEffect(() => {
    setWeightKg((w) => clampWeight(species, w));
    setIdealWeightKg((w) => clampWeight(species, w));
    setAgeMonths((m) => clampAgeMonths(species, m));
  }, [species]);

  const handleSpeciesChange = (next: Species) => {
    setSpecies(next);
    if (name === defaultPetName[species]) {
      setName(defaultPetName[next]);
    }
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    void onSubmit({
      species,
      name: trimmed.length > 0 ? trimmed : defaultPetName[species],
      weightKg: clampWeight(species, weightKg),
      idealWeightKg: clampWeight(species, idealWeightKg),
      bcsScore,
      bcsAssessedAt:
        bcsScore === null
          ? null
          : bcsScore === initial.bcsScore && initial.bcsAssessedAt
            ? initial.bcsAssessedAt
            : new Date().toISOString(),
      lifeStage,
      neutered,
      activity,
    });
  };

  return (
    <form
      className="flex flex-col gap-3.5"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div>
        <p className="mb-2 text-sm text-muted">{t("species")}</p>
        <SegmentControl
          aria-label={t("species")}
          options={(["cat", "dog"] as Species[]).map((value) => ({
            value,
            label: t(value),
          }))}
          value={species}
          onChange={handleSpeciesChange}
        />
      </div>

      <div>
        <label htmlFor="pet-name" className="mb-1.5 block text-sm text-muted">
          {t("name")}
        </label>
        <input
          id="pet-name"
          type="text"
          autoComplete="off"
          enterKeyHint="done"
          className="min-h-11 w-full rounded-xl border border-line bg-card px-3 py-2.5 text-base text-ink touch-manipulation outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm text-muted">{t("weight")}</p>
        <DecimalWheelPicker
          species={species}
          value={weightKg}
          onChange={setWeightKg}
          aria-label={t("weight")}
        />
      </div>

      <div>
        <p className="mb-1.5 text-sm text-muted">{t("targetWeight")}</p>
        <DecimalWheelPicker
          species={species}
          value={idealWeightKg}
          onChange={setIdealWeightKg}
          aria-label={t("targetWeight")}
        />
      </div>

      <BcsAssessment species={species} value={bcsScore} onChange={setBcsScore} />

      <div>
        <p className="mb-2 text-sm text-muted">{t("ageStage")}</p>
        <AgeProgressBar species={species} ageMonths={ageMonths} onAgeMonthsChange={setAgeMonths} />
      </div>

      <div>
        <p className="mb-2 text-sm text-muted">{t("neutered")}</p>
        <SegmentControl
          aria-label={t("neutered")}
          options={[
            { value: "yes", label: t("yes") },
            { value: "no", label: t("no") },
          ]}
          value={neutered ? "yes" : "no"}
          onChange={(v) => setNeutered(v === "yes")}
        />
      </div>

      <div>
        <p className="mb-2 text-sm text-muted">{t("activity")}</p>
        <SegmentControl
          aria-label={t("activity")}
          compact
          options={(Object.keys(activityLabelsBySpecies[species]) as ActivityLevel[]).map(
            (value) => ({
              value,
              label: t(
                `${value}${species === "cat" ? "Cat" : "Dog"}Activity`.replace(/^./, (c) =>
                  c.toLowerCase(),
                ),
              ),
            }),
          )}
          value={activity}
          onChange={setActivity}
        />
      </div>

      <button
        type="submit"
        className="min-h-11 w-full rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white touch-manipulation active:bg-accent-press"
      >
        {submitLabel}
      </button>

      {onDelete ? (
        <button
          type="button"
          className="min-h-11 w-full rounded-xl border border-line bg-card px-3 py-2 text-sm font-medium text-muted touch-manipulation active:bg-surface"
          onClick={() => void onDelete()}
        >
          {deleteLabel ?? t("deletePetAndData")}
        </button>
      ) : null}
    </form>
  );
}
