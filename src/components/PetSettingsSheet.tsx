import { Dismiss24Regular } from "@fluentui/react-icons";
import type { CatProfile } from "../db";
import PetProfileForm, { type PetProfileFormValues } from "./PetProfileForm";

export interface PetSettingsSheetProps {
  cat: CatProfile;
  catCount: number;
  onClose: () => void;
  onSave: (values: PetProfileFormValues) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
}

export default function PetSettingsSheet({
  cat,
  onClose,
  onSave,
  onDelete,
}: PetSettingsSheetProps) {
  const handleSave = async (values: PetProfileFormValues) => {
    await onSave(values);
    onClose();
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "将删除当前宠物及其全部数据（常用粮、体重与喂食记录等），且无法恢复。确定继续？",
    );
    if (!confirmed) return;
    await onDelete();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-[#f5f6f8]/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="宠物设置"
    >
      <header className="flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1">
        <h2 className="text-base font-semibold text-ink">宠物设置</h2>
        <button
          type="button"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full touch-manipulation active:bg-surface"
          aria-label="关闭设置"
          onClick={onClose}
        >
          <Dismiss24Regular className="size-6 text-muted" aria-hidden />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-3 pb-[max(5rem,env(safe-area-inset-bottom))]">
        <PetProfileForm
          initial={cat}
          submitLabel="保存"
          onSubmit={handleSave}
          onDelete={cat.onboardingDone ? handleDelete : undefined}
        />
      </div>
    </div>
  );
}
