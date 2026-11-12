import React from 'react';
import { CheckCircle2, FileCheck2, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: 'success' | 'info' | 'document';
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      data-testid="toast-container"
      aria-live="polite"
      className="fixed bottom-16 lg:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none print:hidden"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.variant === 'document'
            ? FileCheck2
            : toast.variant === 'info'
            ? Info
            : CheckCircle2;

        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xl flex items-start justify-between gap-3 animate-toast-in"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                  {toast.title}
                </div>
                {toast.description && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {toast.description}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Закрыть уведомление"
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Animated auto-dismiss progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800">
              <div className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 animate-toast-progress" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
