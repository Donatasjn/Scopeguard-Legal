import React, { useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  Layers,
  MailCheck,
  Printer,
  RefreshCw,
  Scale,
} from 'lucide-react';
import {
  formatMoney,
  type CurrencyCode,
  type ScopeAuditReport,
} from '../utils/scopeAnalyzer';

interface DeliverablesViewProps {
  report: ScopeAuditReport;
  hourlyRate: number;
  currency: CurrencyCode;
  initialTab?: 'all' | 'email' | 'change-order' | 'json';
  onUpdateEmailSubject: (subject: string) => void;
  onUpdateEmailBody: (body: string) => void;
  onUpdateChangeOrder: (summary: string) => void;
  onRegenerateTemplates: () => void;
  onOpenPrintModal: () => void;
  onEmailCopied?: () => void;
  onNotifyToast?: (title: string, description?: string) => void;
}

export const DeliverablesView: React.FC<DeliverablesViewProps> = ({
  report,
  hourlyRate,
  currency,
  initialTab = 'all',
  onUpdateEmailSubject,
  onUpdateEmailBody,
  onUpdateChangeOrder,
  onRegenerateTemplates,
  onOpenPrintModal,
  onEmailCopied,
  onNotifyToast,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeDeliverableTab, setActiveDeliverableTab] = useState<
    'all' | 'email' | 'change-order' | 'json'
  >(initialTab);

  const handleCopy = async (key: string, text: string, toastTitle: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    if (key === 'email') {
      onEmailCopied?.();
    }
    onNotifyToast?.(
      toastTitle,
      'Готовый текст скопирован в буфер обмена и готов к отправке.'
    );
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadFile = (
    filename: string,
    content: string,
    mimeType = 'text/plain;charset=utf-8'
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotifyToast?.(
      `Файл ${filename} сохранен`,
      'Структурированный JSON-отчет успешно выгружен на устройство.'
    );
  };

  const strictJsonString = JSON.stringify(
    {
      project_name: report.project_name,
      audit_date: report.audit_date,
      out_of_scope_items: report.out_of_scope_items,
      in_scope_items: report.in_scope_items,
      client_email_draft: report.client_email_draft,
      change_order_summary: report.change_order_summary,
    },
    null,
    2
  );

  return (
    <div className="space-y-6">
      {/* Google Docs Compact Pill Toolbar for Deliverable Sheets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 gdocs-sheet rounded-full px-4 py-2.5">
        <div
          role="tablist"
          aria-label="Переключение разделов итоговых документов"
          className="flex flex-wrap items-center gap-1 p-1 bg-[#EDF2FA] dark:bg-slate-800 rounded-full"
        >
          {(
            [
              { id: 'all', label: 'Все листы', icon: Layers },
              { id: 'email', label: 'Письмо клиенту', icon: MailCheck },
              { id: 'change-order', label: 'Доп. соглашение', icon: Scale },
              { id: 'json', label: 'JSON Схема', icon: Code2 },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeDeliverableTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveDeliverableTab(tab.id)}
                className={`min-h-[34px] inline-flex items-center gap-1.5 px-4 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            onRegenerateTemplates();
            onNotifyToast?.(
              'Документы синхронизированы',
              'Часы, ставки и суммы в письме и Change Order обновлены.'
            );
          }}
          className="min-h-[36px] inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-[#EDF2FA] dark:bg-slate-800 hover:bg-[#D3E3FD] dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Синхронизировать шаблоны с реестром</span>
        </button>
      </div>

      {/* Diplomatic Client Email Draft + Formal Change Order Grid */}
      {(activeDeliverableTab === 'all' ||
        activeDeliverableTab === 'email' ||
        activeDeliverableTab === 'change-order') && (
        <div
          key={activeDeliverableTab}
          className={`grid grid-cols-1 ${
            activeDeliverableTab === 'all' ? 'lg:grid-cols-2' : ''
          } gap-6 items-stretch animate-tab-fade`}
        >
          {/* Email Draft Google Docs Sheet */}
          {(activeDeliverableTab === 'all' ||
            activeDeliverableTab === 'email') && (
            <section
              id="email"
              aria-label="Дипломатичное письмо клиенту"
              className="gdocs-sheet rounded-3xl p-6 sm:p-7 flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                      Лист 04. Дипломатичное письмо клиенту
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Спокойное обоснование дополнительного бюджета и сроков без конфронтации.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          'email',
                          `Тема: ${report.client_email_draft.subject}\n\n${report.client_email_draft.body}`,
                          'Письмо клиенту скопировано'
                        )
                      }
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-full shadow-xs transition-all cursor-pointer"
                    >
                      {copiedKey === 'email' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Копировать письмо</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <label
                      htmlFor="email-subject"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Тема письма клиенту
                    </label>
                    <input
                      id="email-subject"
                      type="text"
                      value={report.client_email_draft.subject}
                      onChange={(e) => onUpdateEmailSubject(e.target.value)}
                      className="w-full min-h-[42px] px-4 py-2 text-xs font-semibold text-slate-900 dark:text-white bg-[#F8FAFD] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email-body"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Текст письма с обоснованием доп. соглашения
                    </label>
                    <textarea
                      id="email-body"
                      rows={12}
                      value={report.client_email_draft.body}
                      onChange={(e) => onUpdateEmailBody(e.target.value)}
                      className="w-full p-4 text-xs leading-relaxed text-slate-800 dark:text-slate-200 bg-[#F8FAFD] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:outline-none resize-y"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Тон: Партнерский / Юридически выверенный</span>
                <span className="font-mono tabular-nums">
                  Ставка в расчете: {formatMoney(hourlyRate, currency)}/ч
                </span>
              </div>
            </section>
          )}

          {/* Change Order Legal Clause Google Docs Sheet */}
          {(activeDeliverableTab === 'all' ||
            activeDeliverableTab === 'change-order') && (
            <section
              id="change-order"
              aria-label="Дополнительное соглашение Change Order"
              className="gdocs-sheet rounded-3xl p-6 sm:p-7 flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                      Лист 05. Дополнительное соглашение (Change Order)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Формальная юридическая формулировка для Приложения к Договору.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          'change-order',
                          report.change_order_summary,
                          'Текст Change Order скопирован'
                        )
                      }
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-[#EDF2FA] dark:bg-slate-800 hover:bg-[#D3E3FD] dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
                    >
                      {copiedKey === 'change-order' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Копировать</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={onOpenPrintModal}
                      className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-full shadow-xs transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Экспорт PDF / Печать</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="change-order-textarea"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Юридическая формулировка Приложения к Договору
                  </label>
                  <textarea
                    id="change-order-textarea"
                    rows={15}
                    value={report.change_order_summary}
                    onChange={(e) => onUpdateChangeOrder(e.target.value)}
                    className="w-full p-4 text-xs leading-relaxed font-mono text-slate-800 dark:text-slate-200 bg-[#F8FAFD] dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:outline-none resize-y"
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Готово к вставке в шаблон Договора подряда / ИТ-услуг</span>
                <span className="font-mono tabular-nums">
                  Дата: {report.audit_date}
                </span>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Structured JSON Output Viewer */}
      {(activeDeliverableTab === 'all' || activeDeliverableTab === 'json') && (
        <section
          id="json"
          aria-label="Структурированный JSON-отчет по схеме"
          className="gdocs-sheet rounded-3xl p-6 sm:p-7 animate-tab-fade"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Лист 06. Структурированный JSON-отчет аудита
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Строгое соответствие целевой JSON-схеме для автоматизированного документооборота и интеграций.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  handleDownloadFile(
                    `scope-audit-${report.audit_date}.json`,
                    strictJsonString,
                    'application/json;charset=utf-8'
                  )
                }
                className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-[#EDF2FA] dark:bg-slate-800 hover:bg-[#D3E3FD] dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Скачать .json</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    'json',
                    strictJsonString,
                    'JSON-схема отчета скопирована'
                  )
                }
                className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-full shadow-xs transition-all cursor-pointer"
              >
                {copiedKey === 'json' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>JSON скопирован</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Копировать JSON</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <pre
            data-testid="json-schema-output"
            className="mt-4 p-5 bg-slate-950 text-slate-100 rounded-2xl text-xs font-mono leading-relaxed overflow-x-auto max-h-[380px] border border-slate-800"
          >
            {strictJsonString}
          </pre>
        </section>
      )}
    </div>
  );
};
