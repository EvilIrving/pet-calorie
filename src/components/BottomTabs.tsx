import { Calculator24Regular, Target24Regular } from "@fluentui/react-icons";

export type AppTab = "calc" | "diet";

export interface BottomTabsProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

const tabs: { id: AppTab; label: string; Icon: typeof Calculator24Regular }[] = [
  { id: "calc", label: "热量计算", Icon: Calculator24Regular },
  { id: "diet", label: "减肥计划", Icon: Target24Regular },
];

export default function BottomTabs({ active, onChange }: BottomTabsProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      aria-label="主导航"
    >
      <div className="flex w-full max-w-md gap-1 rounded-full border border-line/80 bg-card/80 p-1 shadow-lg backdrop-blur-xl">
        {tabs.map(({ id, label, Icon }) => {
          const selected = active === id;
          return (
            <button
              key={id}
              type="button"
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors touch-manipulation ${
                selected ? "bg-accent text-white" : "text-muted active:bg-surface"
              }`}
              aria-current={selected ? "page" : undefined}
              onClick={() => onChange(id)}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
