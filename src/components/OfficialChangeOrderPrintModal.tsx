import React from 'react';
import { FileDown, Printer, X } from 'lucide-react';
import {
  calculateScopeMetrics,
  formatMoney,
  getCurrencyConfig,
  type CurrencyCode,
  type ScopeAuditReport,
  type SubscriptionTier,
} from '../utils/scopeAnalyzer';

interface OfficialChangeOrderPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ScopeAuditReport;
  hourlyRate: number;
  currency: CurrencyCode;
  contractNumber: string;
  onChangeContractNumber: (val: string) => void;
  agencyBrandName: string;
  onChangeAgencyBrandName: (val: string) => void;
  executorRequisites: string;
  onChangeExecutorRequisites: (val: string) => void;
  clientRequisites: string;
  onChangeClientRequisites: (val: string) => void;
  tier: SubscriptionTier;
}

export const OfficialChangeOrderPrintModal: React.FC<
  OfficialChangeOrderPrintModalProps
> = ({
  isOpen,
  onClose,
  report,
  hourlyRate,
  currency,
  contractNumber,
  onChangeContractNumber,
  agencyBrandName,
  onChangeAgencyBrandName,
  executorRequisites,
  onChangeExecutorRequisites,
  clientRequisites,
  onChangeClientRequisites,
  tier,
}) => {
  if (!isOpen) return null;

  const currencyCfg = getCurrencyConfig(currency);
  const metrics = calculateScopeMetrics(report.out_of_scope_items, hourlyRate);
  const shiftDays =
    metrics.totalHours > 0 ? Math.max(1, Math.ceil(metrics.totalHours / 6)) : 0;

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadWordDoc = () => {
    const rowsHtml = report.out_of_scope_items
      .map(
        (item) => `
        <tr>
          <td style="border:1px solid #cbd5e1;padding:8px;font-family:monospace;">#${item.id}</td>
          <td style="border:1px solid #cbd5e1;padding:8px;"><strong>${item.title}</strong></td>
          <td style="border:1px solid #cbd5e1;padding:8px;">${item.client_quote}</td>
          <td style="border:1px solid #cbd5e1;padding:8px;">${item.scope_conflict_reason}</td>
          <td style="border:1px solid #cbd5e1;padding:8px;text-align:right;font-family:monospace;">${item.suggested_hours} ч</td>
          <td style="border:1px solid #cbd5e1;padding:8px;text-align:right;font-family:monospace;">${formatMoney(
            item.suggested_hours * hourlyRate,
            currency
          )}</td>
        </tr>`
      )
      .join('');

    const htmlDoc = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8" />
<title>Change Order — ${report.project_name}</title>
</head>
<body style="font-family:Arial,sans-serif;color:#0f172a;padding:32px;line-height:1.5;">
  <div style="border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:20px;">
    <div style="font-size:18px;font-weight:bold;">${agencyBrandName}</div>
    <div style="font-size:12px;color:#475569;">Официальный лист согласования дополнительных работ (Change Order)</div>
  </div>
  <h1 style="font-size:16px;text-transform:uppercase;">ПРИЛОЖЕНИЕ (CHANGE ORDER) К ДОГОВОРУ (${contractNumber})</h1>
  <p style="font-size:13px;"><strong>Проект:</strong> ${report.project_name} · <strong>Дата составления:</strong> ${report.audit_date} · <strong>Валюта:</strong> ${currencyCfg.label}</p>
  <p style="font-size:13px;"><strong>Исполнитель:</strong> ${executorRequisites}</p>
  <p style="font-size:13px;"><strong>Заказчик:</strong> ${clientRequisites}</p>
  <p style="font-size:13px;">1. Стороны пришли к соглашению расширить объем работ по Техническому заданию следующими дополнительными задачами, инициированными Заказчиком:</p>
  <table style="width:100%;border-collapse:collapse;font-size:12px;margin:16px 0;">
    <thead>
      <tr style="background:#f1f5f9;">
        <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;">№</th>
        <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;">Наименование доработки</th>
        <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;">Основание (цитата/таймкод)</th>
        <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;">Расхождение с исходным ТЗ</th>
        <th style="border:1px solid #cbd5e1;padding:8px;text-align:right;">Часы</th>
        <th style="border:1px solid #cbd5e1;padding:8px;text-align:right;">Стоимость (${currencyCfg.symbol})</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
  <p style="font-size:13px;"><strong>2. Итоговый объем дополнительных трудозатрат:</strong> ${metrics.totalHours} нормо-часов.</p>
  <p style="font-size:13px;"><strong>3. Итоговая стоимость работ (по ставке ${formatMoney(hourlyRate, currency)}/ч):</strong> ${formatMoney(metrics.totalCost, currency)} (без НДС).</p>
  <p style="font-size:13px;"><strong>4. Корректировка сроков:</strong> Срок сдачи этапа по Основному договору соразмерно продлевается на +${shiftDays} рабочих дн. с момента подписания настоящего Дополнительного соглашения.</p>
  <br/><br/>
  <table style="width:100%;font-size:13px;margin-top:32px;">
    <tr>
      <td style="width:50%;"><strong>ОТ ИСПОЛНИТЕЛЯ:</strong><br/><br/>_______________________ / М.П.</td>
      <td style="width:50%;"><strong>ОТ ЗАКАЗЧИКА:</strong><br/><br/>_______________________ / М.П.</td>
    </tr>
  </table>
</body>
</html>`;

    const blob = new Blob([htmlDoc], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Change-Order-${report.audit_date}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-modal-title"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto print:static print:bg-white print:p-0"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full p-6 sm:p-8 shadow-xl my-6 print:border-none print:shadow-none print:my-0 print:p-0 print:max-w-none">
        {/* Non-printable Toolbar & Requisites Editor */}
        <div className="print:hidden space-y-4 pb-6 mb-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2
                id="print-modal-title"
                className="text-lg font-bold text-slate-900"
              >
                Официальный бланк Change Order для подписи Заказчиком
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Проверьте реквизиты сторон и нажмите «Печать / Сохранить в PDF» или выгрузите в Word (.doc). Валюта расчета: {currencyCfg.label}.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadWordDoc}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Скачать Word (.doc)</span>
              </button>
              <button
                type="button"
                onClick={handlePrintPdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Печать / Сохранить в PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть предпросмотр печати"
                className="p-2 text-slate-400 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Editable Requisites Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div>
              <label
                htmlFor="print-agency-brand"
                className="block font-semibold text-slate-700 mb-1"
              >
                Бренд / Логотип в шапке документа {tier === 'agency' ? '(Agency White-Label)' : ''}
              </label>
              <input
                id="print-agency-brand"
                type="text"
                value={agencyBrandName}
                onChange={(e) => onChangeAgencyBrandName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="print-contract-num"
                className="block font-semibold text-slate-700 mb-1"
              >
                Основание (номер и дата Договора)
              </label>
              <input
                id="print-contract-num"
                type="text"
                value={contractNumber}
                onChange={(e) => onChangeContractNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="print-executor-req"
                className="block font-semibold text-slate-700 mb-1"
              >
                Реквизиты Исполнителя
              </label>
              <input
                id="print-executor-req"
                type="text"
                value={executorRequisites}
                onChange={(e) => onChangeExecutorRequisites(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="print-client-req"
                className="block font-semibold text-slate-700 mb-1"
              >
                Реквизиты Заказчика
              </label>
              <input
                id="print-client-req"
                type="text"
                value={clientRequisites}
                onChange={(e) => onChangeClientRequisites(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Printable Branded Legal Sheet */}
        <div
          id="printable-change-order-sheet"
          data-testid="printable-change-order-sheet"
          className="bg-white border border-slate-300 rounded-lg p-6 sm:p-10 text-slate-900 space-y-6 print:border-none print:p-0"
        >
          {/* Sheet Brand Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b-2 border-slate-900">
            <div>
              <div className="text-lg font-bold tracking-tight text-slate-900">
                {agencyBrandName || 'ScopeGuard Legal Agency'}
              </div>
              <div className="text-xs text-slate-600">
                Официальная спецификация дополнительных работ (Change Order)
              </div>
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-700 sm:text-right">
              <div>Дата документа: {report.audit_date}</div>
              <div>Основание: {contractNumber}</div>
            </div>
          </div>

          {/* Document Title & Parties */}
          <div className="space-y-2 text-xs leading-relaxed">
            <h3 className="text-base font-bold text-slate-900 uppercase">
              Дополнительное соглашение (Change Order) по проекту «{report.project_name}»
            </h3>
            <p>
              <strong>Исполнитель:</strong> {executorRequisites}
            </p>
            <p>
              <strong>Заказчик:</strong> {clientRequisites}
            </p>
            <p className="pt-1">
              1. В связи с выявлением в ходе рабочих переговоров дополнительных функциональных требований, не входящих в исходное Техническое задание по Основному договору ({contractNumber}), Стороны согласовали выполнение следующего перечня дополнительных работ:
            </p>
          </div>

          {/* Official Hours & Cost Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800">
                  <th className="border border-slate-300 py-2 px-2.5 w-10">№</th>
                  <th className="border border-slate-300 py-2 px-2.5">
                    Наименование доработки
                  </th>
                  <th className="border border-slate-300 py-2 px-2.5">
                    Основание (цитата / таймкод)
                  </th>
                  <th className="border border-slate-300 py-2 px-2.5">
                    Обоснование выхода за рамки ТЗ
                  </th>
                  <th className="border border-slate-300 py-2 px-2.5 text-right w-20">
                    Часы
                  </th>
                  <th className="border border-slate-300 py-2 px-2.5 text-right w-28">
                    Сумма ({currencyCfg.symbol})
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.out_of_scope_items.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="border border-slate-300 py-2 px-2.5 font-mono tabular-nums">
                      1.{item.id}
                    </td>
                    <td className="border border-slate-300 py-2 px-2.5 font-semibold">
                      {item.title}
                    </td>
                    <td className="border border-slate-300 py-2 px-2.5 font-mono text-[11px]">
                      {item.client_quote}
                    </td>
                    <td className="border border-slate-300 py-2 px-2.5">
                      {item.scope_conflict_reason}
                    </td>
                    <td className="border border-slate-300 py-2 px-2.5 text-right font-mono tabular-nums font-semibold">
                      {item.suggested_hours} ч
                    </td>
                    <td className="border border-slate-300 py-2 px-2.5 text-right font-mono tabular-nums font-semibold whitespace-nowrap">
                      {formatMoney(item.suggested_hours * hourlyRate, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-900">
                  <td
                    colSpan={4}
                    className="border border-slate-300 py-2.5 px-2.5 text-right"
                  >
                    ИТОГО ДОПОЛНИТЕЛЬНЫХ РАБОТ (по ставке {formatMoney(hourlyRate, currency)}/ч):
                  </td>
                  <td className="border border-slate-300 py-2.5 px-2.5 text-right font-mono tabular-nums">
                    {metrics.totalHours} ч
                  </td>
                  <td
                    data-testid="print-sheet-total-cost"
                    className="border border-slate-300 py-2.5 px-2.5 text-right font-mono tabular-nums whitespace-nowrap"
                  >
                    {formatMoney(metrics.totalCost, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legal Terms & Schedule Impact */}
          <div className="space-y-1.5 text-xs leading-relaxed text-slate-800">
            <p>
              <strong>2. Стоимость работ и порядок расчетов:</strong> Совокупная стоимость дополнительных работ по настоящему Приложению составляет{' '}
              <span className="font-mono tabular-nums font-semibold">
                {formatMoney(metrics.totalCost, currency)}
              </span>{' '}
              (НДС не облагается / согласно условиям Основного договора).
            </p>
            <p>
              <strong>3. Корректировка сроков:</strong> Сроки сдачи текущего этапа по Основному договору соразмерно увеличиваются на{' '}
              <span className="font-mono tabular-nums font-semibold">
                +{shiftDays} рабочих дн.
              </span>{' '}
              с даты подписания настоящего Дополнительного соглашения обеими Сторонами.
            </p>
          </div>

          {/* Signatures Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-xs">
            <div className="space-y-6">
              <div className="font-bold uppercase text-slate-900">
                От Исполнителя:
              </div>
              <div className="text-slate-600">{executorRequisites}</div>
              <div className="pt-4 border-b border-slate-400 w-64" />
              <div className="text-slate-500">Подпись / Расшифровка / М.П.</div>
            </div>

            <div className="space-y-6">
              <div className="font-bold uppercase text-slate-900">
                От Заказчика:
              </div>
              <div className="text-slate-600">{clientRequisites}</div>
              <div className="pt-4 border-b border-slate-400 w-64" />
              <div className="text-slate-500">Подпись / Расшифровка / М.П.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
