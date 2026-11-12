import React, { useRef, useState } from 'react';
import {
  FileAudio,
  FileCheck2,
  FileText,
  FolderOpen,
  MessageSquareWarning,
  RotateCcw,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { AUDIT_PRESETS, type AuditPreset } from '../data/presets';
import {
  ALLOWED_SPEC_EXTENSIONS,
  ALLOWED_TRANSCRIPT_EXTENSIONS,
  formatFileSize,
  getCurrencyConfig,
  validateUploadedFileMeta,
  type CurrencyCode,
} from '../utils/scopeAnalyzer';

interface SourceInputPanelProps {
  selectedPresetId: string;
  onSelectPreset: (preset: AuditPreset) => void;
  projectName: string;
  onChangeProjectName: (val: string) => void;
  auditDate: string;
  onChangeAuditDate: (val: string) => void;
  hourlyRate: number;
  onChangeHourlyRate: (val: number) => void;
  currency: CurrencyCode;
  specText: string;
  onChangeSpecText: (val: string) => void;
  specFile: File | null;
  onChangeSpecFile: (file: File | null) => void;
  transcriptText: string;
  onChangeTranscriptText: (val: string) => void;
  transcriptFile: File | null;
  onChangeTranscriptFile: (file: File | null) => void;
  onSubmitAudit: (e: React.FormEvent) => void;
  onClearInputs: () => void;
  isAnalyzing: boolean;
  analysisStepText: string;
  analysisProgress: number;
  validationError: string | null;
  onSetValidationError: (err: string | null) => void;
}

export const SourceInputPanel: React.FC<SourceInputPanelProps> = ({
  selectedPresetId,
  onSelectPreset,
  projectName,
  onChangeProjectName,
  auditDate,
  onChangeAuditDate,
  hourlyRate,
  onChangeHourlyRate,
  currency,
  specText,
  onChangeSpecText,
  specFile,
  onChangeSpecFile,
  transcriptText,
  onChangeTranscriptText,
  transcriptFile,
  onChangeTranscriptFile,
  onSubmitAudit,
  onClearInputs,
  isAnalyzing,
  analysisStepText,
  analysisProgress,
  validationError,
  onSetValidationError,
}) => {
  const currencyCfg = getCurrencyConfig(currency);
  const specFileInputRef = useRef<HTMLInputElement | null>(null);
  const transcriptFileInputRef = useRef<HTMLInputElement | null>(null);

  const [isDraggingSpec, setIsDraggingSpec] = useState(false);
  const [isDraggingTranscript, setIsDraggingTranscript] = useState(false);

  const handleFileSelection = (
    file: File | undefined | null,
    fieldType: 'spec' | 'transcript'
  ) => {
    if (!file) return;
    const validation = validateUploadedFileMeta(
      file.name,
      file.size,
      fieldType
    );
    if (!validation.valid) {
      onSetValidationError(validation.error || 'Недопустимый файл.');
      return;
    }

    onSetValidationError(null);

    if (fieldType === 'spec') {
      onChangeSpecFile(file);
      if (
        file.name.toLowerCase().endsWith('.txt') ||
        file.name.toLowerCase().endsWith('.md')
      ) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string' && !specText.trim()) {
            onChangeSpecText(reader.result);
          }
        };
        reader.readAsText(file);
      }
    } else {
      onChangeTranscriptFile(file);
      if (
        file.name.toLowerCase().endsWith('.txt') ||
        file.name.toLowerCase().endsWith('.md')
      ) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string' && !transcriptText.trim()) {
            onChangeTranscriptText(reader.result);
          }
        };
        reader.readAsText(file);
      }
    }
  };

  return (
    <section
      aria-label="Исходные документы для сверки"
      className="glass-card rounded-3xl p-6 sm:p-8 animate-fade-up"
    >
      {/* Top Header + Quick Demo Template Chips */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold">
            <span>Шаг 1 · Загрузка материалов</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            Исходное ТЗ и запись встречи с заказчиком
          </h2>
        </div>

        {/* Demo Template Chips + Clear Button */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
            <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Демо-шаблоны:</span>
          </span>
          {AUDIT_PRESETS.map((preset) => {
            const active =
              selectedPresetId === preset.id && !specFile && !transcriptFile;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`min-h-[34px] px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-500 shadow-xs'
                    : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                {preset.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onClearInputs}
            data-testid="clear-inputs-btn"
            className="min-h-[34px] px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100/90 dark:bg-slate-800 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            title="Очистить поля и прикрепленные файлы"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить</span>
          </button>
        </div>
      </div>

      <form onSubmit={onSubmitAudit} className="mt-6 space-y-6" noValidate>
        {/* Sleek 3-Column Project Metadata Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
          <div>
            <label
              htmlFor="input-project-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Наименование проекта / Договор
            </label>
            <input
              id="input-project-name"
              type="text"
              value={projectName}
              onChange={(e) => onChangeProjectName(e.target.value)}
              placeholder="Например: B2B-портал АгроСнаб"
              className="w-full min-h-[42px] px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="input-hourly-rate"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Ставка часа ({currencyCfg.symbol}/ч · {currencyCfg.code})
            </label>
            <input
              id="input-hourly-rate"
              type="number"
              min={1}
              max={500000}
              step={currency === 'USD' || currency === 'EUR' ? 5 : 100}
              value={hourlyRate}
              onChange={(e) => onChangeHourlyRate(Number(e.target.value))}
              className="w-full min-h-[42px] px-3.5 py-2 text-sm font-mono tabular-nums font-bold bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="input-audit-date"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Дата проведения аудита
            </label>
            <input
              id="input-audit-date"
              type="date"
              value={auditDate}
              onChange={(e) => onChangeAuditDate(e.target.value)}
              className="w-full min-h-[42px] px-3.5 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Side-by-Side Drag-and-Drop Zones with Dashed Highlight on Hover */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Field 1: Initial Specification */}
          <div className="flex flex-col space-y-2.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="textarea-spec"
                className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </span>
                <span>1. Исходные требования (ТЗ, договор, бриф)</span>
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {specFile
                  ? `Файл: ${formatFileSize(specFile.size)}`
                  : `${specText.length} симв.`}
              </span>
            </div>

            <div
              data-testid="dropzone-spec"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingSpec(true);
              }}
              onDragLeave={() => setIsDraggingSpec(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingSpec(false);
                const droppedFile = e.dataTransfer.files?.[0];
                handleFileSelection(droppedFile, 'spec');
              }}
              onClick={() => {
                if (!specFile) specFileInputRef.current?.click();
              }}
              className={`group rounded-2xl border-2 border-dashed p-4 transition-all duration-200 ${
                specFile
                  ? 'border-emerald-500/70 bg-emerald-50/50 dark:bg-emerald-950/25'
                  : isDraggingSpec
                  ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 scale-[1.01] cursor-pointer'
                  : 'border-slate-300/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 cursor-pointer'
              }`}
            >
              <input
                ref={specFileInputRef}
                data-testid="input-file-spec"
                type="file"
                accept={ALLOWED_SPEC_EXTENSIONS.join(',')}
                onChange={(e) => {
                  handleFileSelection(e.target.files?.[0], 'spec');
                  e.target.value = '';
                }}
                className="hidden"
              />

              {specFile ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileCheck2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div
                        data-testid="spec-file-name"
                        className="text-xs font-bold text-slate-900 dark:text-white truncate"
                      >
                        {specFile.name}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                        {formatFileSize(specFile.size)} · Готов к ИИ-сверке
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-testid="remove-spec-file-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeSpecFile(null);
                    }}
                    className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Перетащите файл ТЗ (PDF, DOCX, TXT)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Или нажмите для выбора документа с устройства
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shrink-0">
                    Выбрать файл
                  </span>
                </div>
              )}
            </div>

            <textarea
              id="textarea-spec"
              rows={5}
              value={specText}
              onChange={(e) => onChangeSpecText(e.target.value)}
              placeholder="Или вставьте зафиксированные пункты Технического задания / условия договора вручную..."
              className="w-full p-3.5 text-xs leading-relaxed font-mono bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors resize-y"
            />
          </div>

          {/* Field 2: Meeting Materials */}
          <div className="flex flex-col space-y-2.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="textarea-transcript"
                className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <span className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MessageSquareWarning className="w-3.5 h-3.5" />
                </span>
                <span>2. Материалы встречи (аудио созвона или стенограмма)</span>
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {transcriptFile
                  ? `Медиа: ${formatFileSize(transcriptFile.size)}`
                  : `${transcriptText.length} симв.`}
              </span>
            </div>

            <div
              data-testid="dropzone-transcript"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingTranscript(true);
              }}
              onDragLeave={() => setIsDraggingTranscript(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingTranscript(false);
                const droppedFile = e.dataTransfer.files?.[0];
                handleFileSelection(droppedFile, 'transcript');
              }}
              onClick={() => {
                if (!transcriptFile) transcriptFileInputRef.current?.click();
              }}
              className={`group rounded-2xl border-2 border-dashed p-4 transition-all duration-200 ${
                transcriptFile
                  ? 'border-emerald-500/70 bg-emerald-50/50 dark:bg-emerald-950/25'
                  : isDraggingTranscript
                  ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 scale-[1.01] cursor-pointer'
                  : 'border-slate-300/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 cursor-pointer'
              }`}
            >
              <input
                ref={transcriptFileInputRef}
                data-testid="input-file-transcript"
                type="file"
                accept={ALLOWED_TRANSCRIPT_EXTENSIONS.join(',')}
                onChange={(e) => {
                  handleFileSelection(e.target.files?.[0], 'transcript');
                  e.target.value = '';
                }}
                className="hidden"
              />

              {transcriptFile ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileAudio className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div
                        data-testid="transcript-file-name"
                        className="text-xs font-bold text-slate-900 dark:text-white truncate"
                      >
                        {transcriptFile.name}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                        {formatFileSize(transcriptFile.size)} · Gemini File API
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-testid="remove-transcript-file-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeTranscriptFile(null);
                    }}
                    className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Запись созвона (MP3, WAV, M4A) или видео
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Нажмите для загрузки аудио или вставьте стенограмму ниже
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shrink-0">
                    Загрузить медиа
                  </span>
                </div>
              )}
            </div>

            <textarea
              id="textarea-transcript"
              rows={5}
              value={transcriptText}
              onChange={(e) => onChangeTranscriptText(e.target.value)}
              placeholder="Или вставьте текстовую стенограмму встречи Zoom/Meet / переписку из Telegram..."
              className="w-full p-3.5 text-xs leading-relaxed font-mono bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none transition-colors resize-y"
            />
          </div>
        </div>

        {/* Pulsing AI Progress Bar when Analyzing */}
        {isAnalyzing && (
          <div
            data-testid="analysis-progress-panel"
            role="status"
            aria-live="polite"
            className="p-5 rounded-2xl bg-[#0B0F19] text-white border border-indigo-500/40 space-y-3 animate-ai-pulse"
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 text-emerald-300">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>{analysisStepText || 'Читаем ТЗ...'}</span>
              </span>
              <span className="font-mono tabular-nums text-white">
                {analysisProgress}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(10, analysisProgress))}%`,
                }}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
              {[
                { label: 'Читаем ТЗ...', threshold: 15 },
                { label: 'Сверяем стенограмму...', threshold: 40 },
                { label: 'Считаем нормо-часы...', threshold: 65 },
                { label: 'Формируем обоснование...', threshold: 85 },
              ].map((step) => {
                const reached = analysisProgress >= step.threshold;
                return (
                  <span
                    key={step.label}
                    className={`truncate transition-colors ${
                      reached
                        ? 'text-emerald-300 font-semibold'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {validationError && (
          <div
            data-testid="validation-error-banner"
            role="alert"
            className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs font-medium text-rose-800 dark:text-rose-300"
          >
            {validationError}
          </div>
        )}

        {/* Submit Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Все найденные расхождения автоматически сохраняются в раздел «Архив»
          </div>

          <button
            type="submit"
            data-testid="submit-audit-btn"
            disabled={isAnalyzing}
            className={`min-h-[48px] inline-flex items-center justify-center gap-2.5 px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 disabled:opacity-60 rounded-2xl shadow-[0_10px_28px_-6px_rgba(79,70,229,0.5)] transition-all active:scale-95 cursor-pointer shrink-0 ${
              isAnalyzing ? 'animate-ai-pulse' : ''
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isAnalyzing
                ? analysisStepText || 'Читаем ТЗ...'
                : 'Запустить юридический аудит Scope Creep'}
            </span>
          </button>
        </div>
      </form>
    </section>
  );
};
