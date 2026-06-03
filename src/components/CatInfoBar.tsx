import { AnimalCat24Regular, AnimalDog24Regular, Settings24Regular } from "@fluentui/react-icons";
import type { Species } from "../config/nutrition";
import { speciesLabels } from "../config/nutrition";

export interface CatInfoBarProps {
  species: Species;
  name: string;
  weightKg: number;
  onSettings?: () => void;
}

export default function CatInfoBar({ species, name, weightKg, onSettings }: CatInfoBarProps) {
  const SpeciesIcon = species === "dog" ? AnimalDog24Regular : AnimalCat24Regular;

  return (
    <button
      type="button"
      className="flex w-full min-h-11 items-center gap-2 rounded-xl bg-card px-3 py-2 text-left shadow-sm touch-manipulation active:bg-surface"
      aria-label={`${speciesLabels[species]} ${name}，${weightKg} 千克，打开设置`}
      onClick={onSettings}
    >
      <SpeciesIcon className="size-5 shrink-0 text-accent" aria-hidden />
      <span className="flex-1 text-sm font-medium text-ink">
        {name} · {weightKg.toFixed(1)}kg
      </span>
      <Settings24Regular className="size-5 text-muted" aria-hidden />
    </button>
  );
}
