import React, { useState } from 'react';
import { Check, Copy, Download, Printer, RefreshCw } from 'lucide-react';
import {
  formatMoney,
  type CurrencyCode,
  type ScopeAuditReport,
} from '../utils/scopeAnalyzer';

interface DeliverablesViewProps {
  report: ScopeAuditReport;
  hourlyRate: number;
  currency: CurrencyCode;
  onUpdateEmailSubject: (subject: string) => void;
  onUpdateEmailBody: (body: string) => void;
  onUpdateChangeOrder: (summary: string) => void;
  onRegenerateTemplates: () => void;
  onOpenPrintModal: () => void;
}

export const DeliverablesView: React.FC<DeliverablesViewProps> = ({
  report,
  hourlyRate,
  currency,
  onUpdateEmailSubject,
  onUpdateEmailBody,
  onUpdateChangeOrder,
  onRegenerateTemplates,
  onOpenPrintModal,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
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
      {/* Diplomatic Client Email Draft + Formal Change Order Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Email Draft Card */}
        <section
          id="email"
          aria-label="Дипломатичное письмо клиенту"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  04. Дипломатичное письмо клиенту
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Спокойное обоснование дополнительного бюджета и сроков без конфронтации.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onRegenerateTemplates}
                  title="Обновить расчет часов и сумм в тексте письма и Change Order"
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Пересчитать</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      'email',
                      `Тема: ${report.client_email_draft.subject}\n\n${report.client_email_draft.body}`
                    )
                  }
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer"
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
                  className="w-full min-h-[42px] px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:outline-none"
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
                  className="w-full p-3.5 text-xs leading-relaxed text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:outline-none resize-y"
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

        {/* Change Order Legal Clause Card */}
        <section
          id="change-order"
          aria-label="Дополнительное соглашение Change Order"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  05. Текст Дополнительного соглашения (Change Order)
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Формальная юридическая формулировка для Приложения к Договору.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy('change-order', report.change_order_summary)
                  }
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
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
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Экспорт Change Order в PDF / Печать</span>
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
                className="w-full p-3.5 text-xs leading-relaxed font-mono text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:outline-none resize-y"
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
      </div>

      {/* Structured JSON Output Viewer */}
      <section
        id="json"
        aria-label="Структурированный JSON-отчет по схеме"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              06. Структурированный JSON-отчет аудита
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
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
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать .json</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopy('json', strictJsonString)}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer"
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
          className="mt-4 p-4 bg-slate-950 text-slate-100 rounded-xl text-xs font-mono leading-relaxed overflow-x-auto max-h-[380px] border border-slate-800"
        >
          {strictJsonString}
        </pre>
      </section>
    </div>
  );
};
