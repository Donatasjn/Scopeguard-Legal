import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import {
  clampSuggestedHours,
  formatMoney,
  getCurrencyConfig,
  truncateTitleToSixWords,
  type CurrencyCode,
  type OutOfScopeItem,
  type SeverityLevel,
} from '../utils/scopeAnalyzer';

interface ScopeItemsTableProps {
  outOfScopeItems: OutOfScopeItem[];
  inScopeItems: string[];
  hourlyRate: number;
  currency: CurrencyCode;
  onUpdateItemHours: (id: number, hours: number) => void;
  onUpdateItemSeverity: (id: number, severity: SeverityLevel) => void;
  onDeleteItem: (id: number) => void;
  onAddItem: (newItem: Omit<OutOfScopeItem, 'id'>) => void;
  onAddInScopeItem: (text: string) => void;
  onRemoveInScopeItem: (index: number) => void;
}

export const ScopeItemsTable: React.FC<ScopeItemsTableProps> = ({
  outOfScopeItems,
  inScopeItems,
  hourlyRate,
  currency,
  onUpdateItemHours,
  onUpdateItemSeverity,
  onDeleteItem,
  onAddItem,
  onAddInScopeItem,
  onRemoveInScopeItem,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | SeverityLevel>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // New out-of-scope item form state
  const [newTitle, setNewTitle] = useState('');
  const [newQuote, setNewQuote] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newHours, setNewHours] = useState(12);
  const [newSeverity, setNewSeverity] = useState<SeverityLevel>('medium');
  const [addFormError, setAddFormError] = useState<string | null>(null);

  // New in-scope item state
  const [newInScopeText, setNewInScopeText] = useState('');

  const filteredItems = outOfScopeItems.filter((item) => {
    const matchesSeverity =
      severityFilter === 'all' || item.severity === severityFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.client_quote.toLowerCase().includes(q) ||
      item.scope_conflict_reason.toLowerCase().includes(q);
    return matchesSeverity && matchesQuery;
  });

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newQuote.trim() || !newReason.trim()) {
      setAddFormError(
        'Заполните краткую суть хотелки, цитату/таймкод клиента и причину расхождения с ТЗ.'
      );
      return;
    }
    setAddFormError(null);
    onAddItem({
      title: truncateTitleToSixWords(newTitle),
      client_quote: newQuote.trim(),
      scope_conflict_reason: newReason.trim(),
      suggested_hours: clampSuggestedHours(newHours),
      severity: newSeverity,
    });
    setNewTitle('');
    setNewQuote('');
    setNewReason('');
    setNewHours(12);
    setNewSeverity('medium');
    setIsAddFormOpen(false);
  };

  const handleCreateInScope = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInScopeText.trim()) return;
    onAddInScopeItem(newInScopeText.trim());
    setNewInScopeText('');
  };

  const formatSeverityLabel = (sev: SeverityLevel) => {
    if (sev === 'critical') return 'Критичный (critical)';
    if (sev === 'medium') return 'Средний (medium)';
    return 'Низкий (low)';
  };

  return (
    <div className="space-y-6">
      {/* Out of Scope Register */}
      <section
        aria-label="Реестр новых хотелок вне ТЗ"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              02. Выявленный Scope Creep: реестр доработок вне ТЗ
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Интерактивный превью-лист: меняйте часы и критичность — смета и Change Order пересчитываются мгновенно.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddFormOpen((prev) => !prev)}
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить доработку</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented filter control */}
          <div
            role="group"
            aria-label="Фильтр по критичности"
            className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl"
          >
            {(
              [
                { id: 'all', label: 'Все' },
                { id: 'critical', label: 'Критичные' },
                { id: 'medium', label: 'Средние' },
                { id: 'low', label: 'Низкие' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSeverityFilter(tab.id)}
                className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  severityFilter === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Поиск по реестру доработок"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по цитате или ТЗ..."
              className="w-full min-h-[40px] pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Collapsible manual addition form */}
        {isAddFormOpen && (
          <form
            onSubmit={handleCreateItem}
            className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Ручная фиксация дополнительного требования клиента
              </h3>
              <button
                type="button"
                onClick={() => setIsAddFormOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Отмена
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div>
                <label
                  htmlFor="new-item-title"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Краткая суть хотелки (до 6 слов)
                </label>
                <input
                  id="new-item-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Напр.: Экспорт аналитики в PDF"
                  className="w-full min-h-[42px] px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="new-item-hours"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Оценка трудозатрат (1–40 ч)
                </label>
                <input
                  id="new-item-hours"
                  type="number"
                  min={1}
                  max={40}
                  value={newHours}
                  onChange={(e) => setNewHours(Number(e.target.value))}
                  className="w-full min-h-[42px] px-3 py-2 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="new-item-severity"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Уровень влияния на архитектуру
                </label>
                <select
                  id="new-item-severity"
                  value={newSeverity}
                  onChange={(e) =>
                    setNewSeverity(e.target.value as SeverityLevel)
                  }
                  className="w-full min-h-[42px] px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="critical">Критичный (critical)</option>
                  <option value="medium">Средний (medium)</option>
                  <option value="low">Низкий (low)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="new-item-quote"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Точная цитата заказчика и таймкод
                </label>
                <input
                  id="new-item-quote"
                  type="text"
                  value={newQuote}
                  onChange={(e) => setNewQuote(e.target.value)}
                  placeholder="[18:20] «Давайте еще кнопку выгрузки презентации в PDF»"
                  className="w-full min-h-[42px] px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="new-item-reason"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Почему противоречит ТЗ (пункт договора)
                </label>
                <input
                  id="new-item-reason"
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="В п. 4.1 ТЗ предусмотрен только просмотр в веб-интерфейсе."
                  className="w-full min-h-[42px] px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {addFormError && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400 font-medium">
                {addFormError}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 cursor-pointer"
              >
                Зафиксировать в реестре
              </button>
            </div>
          </form>
        )}

        {/* Empty State */}
        {filteredItems.length === 0 ? (
          <div className="mt-5 py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Дополнительных требований по выбранному фильтру не найдено
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Сбросьте фильтр критичности или добавьте новую позицию вручную.
            </p>
            {severityFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSeverityFilter('all')}
                className="mt-3 min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Показать все позиции ({outOfScopeItems.length})
              </button>
            )}
          </div>
        ) : (
          <>
            {/* MOBILE CARD STACK VIEW (Visible on smartphones < md, zero horizontal scroll) */}
            <div
              data-testid="mobile-scope-cards"
              className="md:hidden mt-4 space-y-3"
            >
              {filteredItems.map((item) => {
                const itemCost = item.suggested_hours * hourlyRate;
                return (
                  <article
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-mono tabular-nums text-slate-400">
                          Позиция #{item.id}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mt-0.5">
                          {item.title}
                        </h3>
                      </div>
                      <div className="text-right font-mono tabular-nums shrink-0">
                        <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          {formatMoney(itemCost, currency)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.suggested_hours} нормо-ч
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800 leading-relaxed">
                      {item.client_quote}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      <strong className="text-slate-900 dark:text-white">
                        Расхождение с ТЗ:{' '}
                      </strong>
                      {item.scope_conflict_reason}
                    </div>

                    {/* Touch-friendly controls bar (min-h-[44px]) */}
                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                      <select
                        aria-label={`Мобильный выбор критичности для ${item.title}`}
                        value={item.severity}
                        onChange={(e) =>
                          onUpdateItemSeverity(
                            item.id,
                            e.target.value as SeverityLevel
                          )
                        }
                        className="min-h-[44px] px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                      >
                        <option value="critical">Критичный</option>
                        <option value="medium">Средний</option>
                        <option value="low">Низкий</option>
                      </select>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          aria-label={`Мобильные часы на ${item.title}`}
                          min={1}
                          max={40}
                          value={item.suggested_hours}
                          onChange={(e) =>
                            onUpdateItemHours(item.id, Number(e.target.value))
                          }
                          className="w-16 min-h-[44px] px-2.5 py-1.5 text-right text-xs font-mono tabular-nums font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                        />
                        <span className="text-xs font-mono text-slate-500">
                          ч
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        aria-label={`Удалить карточку ${item.title}`}
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 text-slate-400 hover:text-red-600 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (Visible on md and up, zero horizontal clipping) */}
            <div className="hidden md:block mt-4">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-3 pr-3 w-[44%]">
                      Позиция вне ТЗ и юридическое обоснование
                    </th>
                    <th className="py-3 px-3 w-[32%]">
                      Цитата / Таймкод созвона
                    </th>
                    <th className="py-3 px-2 text-right w-[12%]">Часы</th>
                    <th className="py-3 pl-2 text-right w-[12%]">
                      Смета ({getCurrencyConfig(currency).symbol})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {filteredItems.map((item) => {
                    const itemCost = item.suggested_hours * hourlyRate;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors align-top"
                      >
                        <td className="py-3.5 pr-3">
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono tabular-nums text-slate-400 dark:text-slate-500 shrink-0">
                              #{item.id}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                              {item.title}
                            </span>
                          </div>

                          <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                            {item.scope_conflict_reason}
                          </p>

                          <div className="mt-2 flex items-center gap-1.5 text-xs">
                            {item.severity === 'critical' ? (
                              <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                            ) : item.severity === 'medium' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            )}
                            <select
                              aria-label={`Критичность для ${item.title}`}
                              value={item.severity}
                              onChange={(e) =>
                                onUpdateItemSeverity(
                                  item.id,
                                  e.target.value as SeverityLevel
                                )
                              }
                              className={`bg-transparent font-semibold focus:outline-none cursor-pointer ${
                                item.severity === 'critical'
                                  ? 'text-red-700 dark:text-red-400'
                                  : item.severity === 'medium'
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <option value="critical">
                                {formatSeverityLabel('critical')}
                              </option>
                              <option value="medium">
                                {formatSeverityLabel('medium')}
                              </option>
                              <option value="low">
                                {formatSeverityLabel('low')}
                              </option>
                            </select>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-mono text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                          {item.client_quote}
                        </td>

                        <td className="py-3.5 px-2 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <input
                              type="number"
                              aria-label={`Часы на ${item.title}`}
                              min={1}
                              max={40}
                              value={item.suggested_hours}
                              onChange={(e) =>
                                onUpdateItemHours(
                                  item.id,
                                  Number(e.target.value)
                                )
                              }
                              className="w-14 px-2 py-1 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:outline-none"
                            />
                            <span className="text-slate-500 font-mono">ч</span>
                          </div>
                        </td>

                        <td className="py-3.5 pl-2 text-right">
                          <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {formatMoney(itemCost, currency)}
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteItem(item.id)}
                            aria-label={`Удалить ${item.title}`}
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Удалить</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Confirmed In-Scope Items Section */}
      <section
        aria-label="Подтвержденные пункты в рамках ТЗ"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              03. Подтверждено в рамках текущего ТЗ и базовой сметы
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Задачи, которые обсуждались на созвоне и уже входят в базовый договор.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            Пунктов в ТЗ: {inScopeItems.length}
          </span>
        </div>

        <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {inScopeItems.map((itemText, idx) => (
            <li
              key={idx}
              className="py-2.5 flex items-start justify-between gap-4 text-xs text-slate-800 dark:text-slate-200"
            >
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{itemText}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveInScopeItem(idx)}
                aria-label={`Удалить пункт в рамках ТЗ №${idx + 1}`}
                className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center text-slate-400 hover:text-red-600 shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleCreateInScope} className="mt-4 flex gap-2">
          <input
            type="text"
            aria-label="Новый пункт в рамках ТЗ"
            value={newInScopeText}
            onChange={(e) => setNewInScopeText(e.target.value)}
            placeholder="Добавить подтвержденный пункт из текущего ТЗ..."
            className="flex-1 min-h-[44px] px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 py-2 text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
          >
            Добавить пункт ТЗ
          </button>
        </form>
      </section>
    </div>
  );
};
