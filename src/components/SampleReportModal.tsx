import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileSearch,
  MailCheck,
  Scale,
  ShieldAlert,
  X,
} from 'lucide-react';
import { AUDIT_PRESETS, type AuditPreset } from '../data/presets';
import {
  calculateScopeMetrics,
  convertHourlyRate,
  formatMoney,
  rebuildChangeOrderSummary,
  rebuildClientEmailDraft,
  type CurrencyCode,
} from '../utils/scopeAnalyzer';
import { BrandLogoIcon } from './BrandLogo';

interface SampleReportModalProps {
  isOpen: boolean;
  currency: CurrencyCode;
  onClose: () => void;
  onLoadPresetInWorkspace: (preset: AuditPreset) => void;
}

export const SampleReportModal: React.FC<SampleReportModalProps> = ({
  isOpen,
  currency,
  onClose,
  onLoadPresetInWorkspace,
}) => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [activePreviewTab, setActivePreviewTab] = useState<
    'items' | 'email' | 'change-order'
  >('items');

  if (!isOpen) return null;

  const activePreset = AUDIT_PRESETS[selectedPresetIndex] ?? AUDIT_PRESETS[0];
  const convertedRate = convertHourlyRate(
    activePreset.hourlyRate,
    'RUB',
    currency
  );
  const metrics = calculateScopeMetrics(
    activePreset.report.out_of_scope_items,
    convertedRate
  );
  const emailDraft = rebuildClientEmailDraft(
    activePreset.report.project_name,
    activePreset.report.out_of_scope_items,
    activePreset.report.in_scope_items,
    convertedRate,
    currency
  );
  const changeOrderText = rebuildChangeOrderSummary(
    activePreset.report.project_name,
    activePreset.report.audit_date,
    activePreset.report.out_of_scope_items,
    convertedRate,
    currency
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sample-report-modal-title"
      data-testid="sample-report-modal"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-modal-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl max-w-4xl w-full p-5 sm:p-7 shadow-xl my-6 animate-modal-content space-y-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <BrandLogoIcon className="w-8 h-8 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Интерактивное превью реального аудита
              </div>
              <h2
                id="sample-report-modal-title"
                className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5"
              >
                Пример реального отчета ScopeGuard Legal
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Оцените детализацию найденных расхождений с ТЗ, расчет часов и готовые юридические формулировки до запуска проверки.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть превью отчета"
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Case Switcher + Summary Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
              Кейс:
            </span>
            {AUDIT_PRESETS.map((preset, idx) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedPresetIndex(idx)}
                className={`min-h-[34px] px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedPresetIndex === idx
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Правки: </span>
              <strong className="text-slate-900 dark:text-white">
                {metrics.itemCount} поз. ({metrics.totalHours} ч)
              </strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Бюджет: </span>
              <strong className="text-indigo-600 dark:text-indigo-400">
                +{formatMoney(metrics.totalCost, currency)}
              </strong>
            </div>
          </div>
        </div>

        {/* Sub-navigation inside Preview Modal */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          {(
            [
              {
                id: 'items',
                label: `Найденный Scope Creep (${metrics.itemCount})`,
                icon: FileSearch,
              },
              {
                id: 'email',
                label: 'Дипломатичное письмо',
                icon: MailCheck,
              },
              {
                id: 'change-order',
                label: 'Change Order',
                icon: Scale,
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activePreviewTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePreviewTab(tab.id)}
                className={`min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Preview Content Area */}
        <div
          key={`${activePreset.id}-${activePreviewTab}`}
          className="max-h-[340px] overflow-y-auto pr-1 space-y-3 animate-tab-fade"
        >
          {activePreviewTab === 'items' &&
            activePreset.report.out_of_scope_items.map((item) => {
              const cost = item.suggested_hours * convertedRate;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono tabular-nums text-slate-400">
                        #{item.id}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          item.severity === 'critical'
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                            : item.severity === 'medium'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {item.severity === 'critical' ? (
                          <ShieldAlert className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>
                          {item.severity === 'critical'
                            ? 'Критично'
                            : item.severity === 'medium'
                            ? 'Средний'
                            : 'Низкий'}
                        </span>
                      </span>
                    </div>

                    <div className="text-right font-mono tabular-nums shrink-0">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        +{formatMoney(cost, currency)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                        ({item.suggested_hours} ч)
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800">
                    {item.client_quote}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong className="text-slate-900 dark:text-white">
                      Почему вне ТЗ:{' '}
                    </strong>
                    {item.scope_conflict_reason}
                  </p>
                </div>
              );
            })}

          {activePreviewTab === 'email' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
                Тема: {emailDraft.subject}
              </div>
              <pre className="text-xs font-sans whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-200">
                {emailDraft.body}
              </pre>
            </div>
          )}

          {activePreviewTab === 'change-order' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
                {changeOrderText}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              В кабинете вы можете редактировать часы, экспортировать PDF и загружать свои документы
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Закрыть
            </button>
            <button
              type="button"
              data-testid="sample-modal-load-btn"
              onClick={() => {
                onLoadPresetInWorkspace(activePreset);
                onClose();
              }}
              className="min-h-[42px] inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Открыть этот отчет в кабинете</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
