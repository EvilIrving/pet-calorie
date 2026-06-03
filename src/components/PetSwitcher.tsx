import {
  AnimalCat24Regular,
  AnimalDog24Regular,
  Checkmark24Regular,
  Delete24Regular,
  Dismiss24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";
import type { Species } from "../config/nutrition";
import type { CatProfile } from "../db";

export interface PetSwitcherProps {
  cats: CatProfile[];
  activePetId: number;
  onSelect: (petId: number) => void;
  onAdd: () => void;
  onEdit: (petId: number) => void;
  onDelete: (petId: number) => void;
  onClose: () => void;
}

function SpeciesIcon({ species }: { species: Species }) {
  if (species === "dog") return <AnimalDog24Regular className="size-6 text-accent" aria-hidden />;
  return <AnimalCat24Regular className="size-6 text-accent" aria-hidden />;
}

export default function PetSwitcher({
  cats,
  activePetId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onClose,
}: PetSwitcherProps) {
  const canDelete = cats.length > 1;

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-[#f5f6f8]/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="我的宠物"
    >
      <header className="flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1">
        <h2 className="text-base font-semibold text-ink">我的宠物</h2>
        <button
          type="button"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full touch-manipulation active:bg-surface"
          aria-label="关闭"
          onClick={onClose}
        >
          <Dismiss24Regular className="size-6 text-muted" aria-hidden />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-3">
        <div className="flex flex-col gap-1">
          {cats.map((cat) => {
            const isActive = cat.id === activePetId;
            return (
              <div key={cat.id} className="flex items-center gap-1">
                <button
                  type="button"
                  className="flex flex-1 min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-left touch-manipulation active:bg-surface"
                  onClick={() => {
                    if (!isActive) onSelect(cat.id);
                    onClose();
                  }}
                >
                  <SpeciesIcon species={cat.species} />
                  <span className="flex-1 text-sm font-medium text-ink">
                    {cat.name} · {cat.weightKg.toFixed(1)}kg
                  </span>
                  {isActive ? (
                    <Checkmark24Regular className="size-5 text-accent" aria-label="当前选中" />
                  ) : null}
                </button>
                <button
                  type="button"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full touch-manipulation active:bg-surface"
                  aria-label={`编辑 ${cat.name}`}
                  onClick={() => onEdit(cat.id)}
                >
                  <Settings24Regular className="size-5 text-muted" aria-hidden />
                </button>
                {canDelete ? (
                  <button
                    type="button"
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-full touch-manipulation active:bg-surface"
                    aria-label={`删除 ${cat.name}`}
                    onClick={() => onDelete(cat.id)}
                  >
                    <Delete24Regular className="size-5 text-muted" aria-hidden />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          className="w-full min-h-11 rounded-xl border border-accent bg-card px-3 py-2 text-sm font-medium text-accent touch-manipulation active:bg-accent/10"
          onClick={onAdd}
        >
          ＋ 新增宠物
        </button>
      </div>
    </div>
  );
}
