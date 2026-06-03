import { Dismiss24Regular } from "@fluentui/react-icons";
import type { ReactNode } from "react";

export interface SheetProps {
  title: string;
  subtitle?: string;
  ariaLabel: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Sheet({
  title,
  subtitle,
  ariaLabel,
  onClose,
  children,
  footer,
}: SheetProps) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        aria-label="关闭"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className="relative mx-auto w-full max-w-md rounded-t-card bg-card px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.12)]"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-ink">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full touch-manipulation active:bg-surface"
            aria-label="关闭"
            onClick={onClose}
          >
            <Dismiss24Regular className="size-6 text-muted" aria-hidden />
          </button>
        </div>
        {children}
        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </div>
  );
}
