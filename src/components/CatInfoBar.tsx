import { AnimalCat24Regular, AnimalDog24Regular } from "@fluentui/react-icons";
import type { Species } from "../config/nutrition";
import { speciesLabels } from "../config/nutrition";

export interface CatInfoBarProps {
  species: Species;
  name: string;
  weightKg: number;
  onClick: () => void;
}

export default function CatInfoBar({ species, name, weightKg, onClick }: CatInfoBarProps) {
  const SpeciesIcon = species === "dog" ? AnimalDog24Regular : AnimalCat24Regular;

  return (
    <button
      type="button"
      className="flex w-full min-h-11 items-center gap-2 rounded-xl bg-card px-3 py-2 text-left shadow-sm touch-manipulation active:bg-surface"
      aria-label={`${speciesLabels[species]} ${name}，${weightKg} 千克，管理宠物`}
      onClick={onClick}
    >
      <SpeciesIcon className="size-5 shrink-0 text-accent" aria-hidden />
      <span className="flex-1 text-sm font-medium text-ink">
        {name} · {weightKg.toFixed(1)}kg
      </span>
      <span className="text-xs text-muted tabular-nums">{speciesLabels[species]}</span>
    </button>
  );
}
