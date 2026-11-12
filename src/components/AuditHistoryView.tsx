import React, { useMemo, useState } from 'react';
import {
  Calendar,
  ExternalLink,
  FolderSearch,
  PlusCircle,
  Printer,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import {
  convertHourlyRate,
  filterAuditHistory,
  formatMoney,
  type AuditHistoryEntry,
  type CurrencyCode,
} from '../utils/scopeAnalyzer';

interface AuditHistoryViewProps {
  entries: AuditHistoryEntry[];
  activeEntryId: string | null;
  currency: CurrencyCode;
  onOpenEntry: (entry: AuditHistoryEntry) => void;
  onPrintEntry: (entry: AuditHistoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onRestoreSeedHistory: () => void;
  onStartNewAudit: () => void;
}

export const AuditHistoryView: React.FC<AuditHistoryViewProps> = ({
  entries,
  activeEntryId,
  currency,
  onOpenEntry,
  onPrintEntry,
  onDeleteEntry,
  onRestoreSeedHistory,
  onStartNewAudit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  const availableDates = useMemo(() => {
    const set = new Set<string>();
    for (const item of entries) {
      if (item.auditDate) set.add(item.auditDate);
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  const filteredEntries = useMemo(
    () => filterAuditHistory(entries, searchQuery, dateFilter),
    [entries, searchQuery, dateFilter]
  );

  // Calculate aggregate library stats in the currently selected currency
  const libraryTotals = useMemo(() => {
    let totalHours = 0;
    let totalOutItems = 0;
    let totalCostInActiveCurrency = 0;

    for (const entry of entries) {
      totalHours += entry.totalHours;
      totalOutItems += entry.outOfScopeCount;
      const rateInActive = convertHourlyRate(
        entry.hourlyRate,
        entry.currency,
        currency
      );
      totalCostInActiveCurrency += entry.totalHours * rateInActive;
    }

    return {
      projectCount: entries.length,
      totalHours,
      totalOutItems,
      totalCostInActiveCurrency,
    };
  }, [entries, currency]);

  return (
    <div className="space-y-6">
      {/* Header & Aggregate Portfolio Metrics */}
      <section
        aria-label="Сводка библиотеки работ"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Архив проектных сверок и дополнительных соглашений
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 text-balance">
              Библиотека работ и история аудитов
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onRestoreSeedHistory}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Восстановить демо-архив</span>
            </button>
            <button
              type="button"
              onClick={onStartNewAudit}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Новый аудит ТЗ</span>
            </button>
          </div>
        </div>

        {/* 3-Column Portfolio Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Сохранено проверок в истории
            </div>
            <div
              data-testid="history-total-count"
              className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1"
            >
              {libraryTotals.projectCount} проект.
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
              Всего выявлено хотелок: {libraryTotals.totalOutItems} поз.
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Суммарный объем защищенных часов
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
              {libraryTotals.totalHours} нормо-ч
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Зафиксировано в Change Order
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Защищенная выручка по портфелю
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
              {formatMoney(libraryTotals.totalCostInActiveCurrency, currency)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Пересчитано в выбранной валюте ({currency})
            </div>
          </div>
        </div>
      </section>

      {/* Search & Date Filter Controls */}
      <section
        aria-label="Фильтрация и список сохраненных аудитов"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search by project name */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              data-testid="history-search-input"
              aria-label="Поиск проекта в библиотеке"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию проекта, номеру договора или доработке..."
              className="w-full min-h-[44px] pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Filter by date */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                data-testid="history-date-filter"
                aria-label="Фильтр по дате аудита"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="min-h-[44px] px-3 py-2 text-xs font-mono font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="all">Все даты ({entries.length})</option>
                {availableDates.map((dateStr) => (
                  <option key={dateStr} value={dateStr}>
                    Дата: {dateStr}
                  </option>
                ))}
              </select>
            </div>

            {(searchQuery.trim() || dateFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDateFilter('all');
                }}
                className="min-h-[44px] px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer"
              >
                Сбросить фильтр
              </button>
            )}
          </div>
        </div>

        {/* History Cards Grid */}
        {filteredEntries.length === 0 ? (
          <div className="py-14 px-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <FolderSearch className="w-8 h-8 text-slate-400 mx-auto mb-2.5" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Проекты по заданным критериям не найдены
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Попробуйте изменить поисковый запрос, сбросить фильтр даты или запустите новый аудит Технического задания.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDateFilter('all');
                }}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Показать все записи
              </button>
              <button
                type="button"
                onClick={onRestoreSeedHistory}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl cursor-pointer"
              >
                Загрузить примеры проектов
              </button>
            </div>
          </div>
        ) : (
          <div
            data-testid="history-cards-grid"
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {filteredEntries.map((entry) => {
              const isCurrent = activeEntryId === entry.id;
              const convertedRate = convertHourlyRate(
                entry.hourlyRate,
                entry.currency,
                currency
              );
              const convertedTotalCost = entry.totalHours * convertedRate;

              return (
                <article
                  key={entry.id}
                  data-testid={`history-card-${entry.id}`}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-colors ${
                    isCurrent
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Unboxed clean metadata kicker */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      <div className="flex items-center gap-1.5">
                        <span>Дата: {entry.auditDate}</span>
                        <span aria-hidden="true">·</span>
                        <span>{entry.contractNumber}</span>
                      </div>
                      {isCurrent && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold font-sans">
                          Открыт в редакторе
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
                      {entry.projectName}
                    </h3>

                    {/* Key Tabular Metrics Row */}
                    <div className="mt-4 grid grid-cols-3 gap-3 py-3 border-y border-slate-200/80 dark:border-slate-800 font-mono tabular-nums">
                      <div>
                        <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                          Вне скоупа
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {entry.outOfScopeCount} поз.
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                          Трудоемкость
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {entry.totalHours} ч
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                          Сумма сметы
                        </div>
                        <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {formatMoney(convertedTotalCost, currency)}
                        </div>
                      </div>
                    </div>

                    {/* Preview of top out-of-scope items */}
                    <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {entry.report.out_of_scope_items.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-2 truncate"
                        >
                          <span className="truncate">
                            #{item.id}. {item.title}
                          </span>
                          <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                            {item.suggested_hours} ч
                          </span>
                        </div>
                      ))}
                      {entry.report.out_of_scope_items.length > 2 && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          + еще {entry.report.out_of_scope_items.length - 2} поз. в отчете
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 1-Click Action Buttons (Touch-Friendly >= 44px height) */}
                  <div className="mt-5 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      <button
                        type="button"
                        data-testid={`history-open-btn-${entry.id}`}
                        onClick={() => onOpenEntry(entry)}
                        className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Открыть отчет</span>
                      </button>

                      <button
                        type="button"
                        data-testid={`history-print-btn-${entry.id}`}
                        onClick={() => onPrintEntry(entry)}
                        className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Экспорт PDF</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      data-testid={`history-delete-btn-${entry.id}`}
                      onClick={() => onDeleteEntry(entry.id)}
                      aria-label={`Удалить аудит ${entry.projectName}`}
                      title="Удалить аудит из истории"
                      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
