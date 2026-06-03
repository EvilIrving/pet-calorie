import { useEffect, useState } from "react";
import type { ActivityLevel, LifeStage, Species } from "../config/nutrition";
import {
  activityLabelsBySpecies,
  defaultPetName,
  speciesLabels,
  weightRange,
} from "../config/nutrition";
import type { CatProfile } from "../db";
import { clampAgeMonths, lifeStageToMonths, monthsToLifeStage } from "../lib/age";
import AgeProgressBar from "./AgeProgressBar";
import DecimalWheelPicker from "./DecimalWheelPicker";
import SegmentControl from "./SegmentControl";

export interface PetProfileFormValues {
  species: Species;
  name: string;
  weightKg: number;
  idealWeightKg: number | null;
  lifeStage: LifeStage;
  neutered: boolean;
  activity: ActivityLevel;
}

export interface PetProfileFormProps {
  initial: CatProfile;
  submitLabel: string;
  onSubmit: (values: PetProfileFormValues) => void | Promise<void>;
}

function clampWeight(species: Species, kg: number): number {
  const { min, max } = weightRange[species];
  return Math.min(max, Math.max(min, kg));
}

export default function PetProfileForm({ initial, submitLabel, onSubmit }: PetProfileFormProps) {
  const [species, setSpecies] = useState<Species>(initial.species);
  const [name, setName] = useState(initial.name);
  const [weightKg, setWeightKg] = useState(initial.weightKg);
  const [idealWeightKg, setIdealWeightKg] = useState(initial.idealWeightKg ?? initial.weightKg);
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
      lifeStage,
      neutered,
      activity,
    });
  };

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div>
        <p className="mb-3 text-sm text-muted">物种</p>
        <SegmentControl
          aria-label="物种"
          options={(Object.entries(speciesLabels) as [Species, string][]).map(([value, label]) => ({
            value,
            label,
          }))}
          value={species}
          onChange={handleSpeciesChange}
        />
      </div>

      <div>
        <label htmlFor="pet-name" className="mb-2 block text-sm text-muted">
          名字
        </label>
        <input
          id="pet-name"
          type="text"
          autoComplete="off"
          enterKeyHint="done"
          className="min-h-11 w-full rounded-2xl border border-line bg-card px-4 py-3.5 text-lg text-ink touch-manipulation outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <p className="mb-2 text-sm text-muted">体重</p>
        <DecimalWheelPicker
          species={species}
          value={weightKg}
          onChange={setWeightKg}
          aria-label="体重尺子"
        />
      </div>

      <div>
        <p className="mb-2 text-sm text-muted">目标体重</p>
        <DecimalWheelPicker
          species={species}
          value={idealWeightKg}
          onChange={setIdealWeightKg}
          aria-label="目标体重尺子"
        />
      </div>

      <div>
        <p className="mb-3 text-sm text-muted">年龄段</p>
        <AgeProgressBar species={species} ageMonths={ageMonths} onAgeMonthsChange={setAgeMonths} />
      </div>

      <div>
        <p className="mb-3 text-sm text-muted">是否绝育</p>
        <SegmentControl
          aria-label="是否绝育"
          options={[
            { value: "yes", label: "是" },
            { value: "no", label: "否" },
          ]}
          value={neutered ? "yes" : "no"}
          onChange={(v) => setNeutered(v === "yes")}
        />
      </div>

      <div>
        <p className="mb-3 text-sm text-muted">活动量</p>
        <SegmentControl
          aria-label="活动量"
          compact
          options={(
            Object.entries(activityLabelsBySpecies[species]) as [ActivityLevel, string][]
          ).map(([value, label]) => ({ value, label }))}
          value={activity}
          onChange={setActivity}
        />
      </div>

      <button
        type="submit"
        className="min-h-11 w-full rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white touch-manipulation active:bg-accent-press"
      >
        {submitLabel}
      </button>
    </form>
  );
}
