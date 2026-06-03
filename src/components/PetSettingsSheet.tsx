import { Dismiss24Regular } from "@fluentui/react-icons";
import type { CatProfile } from "../db";
import PetProfileForm, { type PetProfileFormValues } from "./PetProfileForm";

export interface PetSettingsSheetProps {
  cat: CatProfile;
  onClose: () => void;
  onSave: (values: PetProfileFormValues) => void | Promise<void>;
}

export default function PetSettingsSheet({ cat, onClose, onSave }: PetSettingsSheetProps) {
  const handleSave = async (values: PetProfileFormValues) => {
    await onSave(values);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#f5f6f8]/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="宠物设置"
    >
      <header className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <h2 className="text-lg font-semibold text-ink">宠物设置</h2>
        <button
          type="button"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full touch-manipulation active:bg-surface"
          aria-label="关闭设置"
          onClick={onClose}
        >
          <Dismiss24Regular className="size-6 text-muted" aria-hidden />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <PetProfileForm initial={cat} submitLabel="保存" onSubmit={handleSave} />
      </div>
    </div>
  );
}
