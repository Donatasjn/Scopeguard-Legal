import React, { useRef, useState } from 'react';
import {
  FileAudio,
  FileCheck2,
  FileText,
  FolderOpen,
  MessageSquareWarning,
  Play,
  RotateCcw,
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
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6"
    >
      <div className="flex flex-col gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              01. Загрузка ТЗ и записи встречи
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Прикрепите файлы с устройства или вставьте текст для автоматического поиска Scope Creep.
            </p>
          </div>
          <button
            type="button"
            onClick={onClearInputs}
            data-testid="clear-inputs-btn"
            className="min-h-[40px] px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            title="Очистить поля и прикрепленные файлы"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Очистить</span>
          </button>
        </div>

        {/* Demo Cases Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mr-1">
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Шаблоны:</span>
          </span>
          {AUDIT_PRESETS.map((preset) => {
            const active =
              selectedPresetId === preset.id && !specFile && !transcriptFile;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`min-h-[36px] px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={onSubmitAudit} className="mt-5 space-y-5" noValidate>
        {/* Metadata Parameters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3.5">
          <div>
            <label
              htmlFor="input-project-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Наименование проекта / Договор
            </label>
            <input
              id="input-project-name"
              type="text"
              value={projectName}
              onChange={(e) => onChangeProjectName(e.target.value)}
              placeholder="Например: B2B-портал АгроСнаб"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:col-span-2 xl:col-span-1">
            <div>
              <label
                htmlFor="input-audit-date"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Дата проведения аудита
              </label>
              <input
                id="input-audit-date"
                type="date"
                value={auditDate}
                onChange={(e) => onChangeAuditDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="input-hourly-rate"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
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
                className="w-full min-h-[44px] px-3.5 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Document Dropzones & Textareas */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-5">
          {/* Field 1: Initial Specification (PDF, DOCX, TXT or manual textarea) */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="textarea-spec"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>1. Исходные требования (ТЗ, договор, бриф)</span>
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {specFile
                  ? `Файл: ${formatFileSize(specFile.size)}`
                  : `${specText.length} симв.`}
              </span>
            </div>

            {/* Mobile-Friendly Touch Dropzone for Field 1 */}
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
              className={`min-h-[60px] rounded-xl border border-dashed p-3.5 transition-colors ${
                specFile
                  ? 'border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : isDraggingSpec
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 cursor-pointer'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-indigo-500 cursor-pointer'
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
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div
                        data-testid="spec-file-name"
                        className="text-xs font-semibold text-slate-900 dark:text-white truncate"
                      >
                        {specFile.name}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                        {formatFileSize(specFile.size)} · Готов к проверке
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
                    className="min-h-[40px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Загрузить файл ТЗ (PDF, DOCX, TXT)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Нажмите для выбора с телефона/ПК или перетащите
                      </div>
                    </div>
                  </div>
                  <span className="min-h-[36px] inline-flex items-center px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shrink-0">
                    Файл
                  </span>
                </div>
              )}
            </div>

            <textarea
              id="textarea-spec"
              rows={6}
              value={specText}
              onChange={(e) => onChangeSpecText(e.target.value)}
              placeholder="Или вставьте зафиксированные пункты Технического задания / условия договора вручную..."
              className="w-full p-3.5 text-xs leading-relaxed font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:outline-none transition-colors resize-y"
            />
          </div>

          {/* Field 2: Meeting Materials (Audio MP3/WAV/M4A, Video MP4/WEBM, or Transcript Text) */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="textarea-transcript"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <MessageSquareWarning className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>2. Материалы встречи (аудио/видео или стенограмма)</span>
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {transcriptFile
                  ? `Медиа: ${formatFileSize(transcriptFile.size)}`
                  : `${transcriptText.length} симв.`}
              </span>
            </div>

            {/* Mobile-Friendly Touch Dropzone for Field 2 */}
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
              className={`min-h-[60px] rounded-xl border border-dashed p-3.5 transition-colors ${
                transcriptFile
                  ? 'border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : isDraggingTranscript
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 cursor-pointer'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-indigo-500 cursor-pointer'
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
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileAudio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div
                        data-testid="transcript-file-name"
                        className="text-xs font-semibold text-slate-900 dark:text-white truncate"
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
                    className="min-h-[40px] inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Удалить</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Запись диктофона / созвона (MP3, WAV, M4A)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Аудио, видео MP4/WEBM или текст стенограммы
                      </div>
                    </div>
                  </div>
                  <span className="min-h-[36px] inline-flex items-center px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shrink-0">
                    Медиа
                  </span>
                </div>
              )}
            </div>

            <textarea
              id="textarea-transcript"
              rows={6}
              value={transcriptText}
              onChange={(e) => onChangeTranscriptText(e.target.value)}
              placeholder="Или вставьте текстовую стенограмму встречи Zoom/Meet / переписку из Telegram..."
              className="w-full p-3.5 text-xs leading-relaxed font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:outline-none transition-colors resize-y"
            />
          </div>
        </div>

        {/* Multi-Step File Upload & Scope Analysis Progress Indicator */}
        {isAnalyzing && (
          <div
            data-testid="analysis-progress-panel"
            role="status"
            aria-live="polite"
            className="p-4 rounded-xl bg-slate-900 dark:bg-indigo-950/90 border border-slate-800 dark:border-indigo-800 text-white space-y-2.5"
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>{analysisStepText || 'Обработка файла...'}</span>
              <span className="font-mono tabular-nums">{analysisProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-400 transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(8, analysisProgress))}%`,
                }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 font-mono">
              <span>1. Обработка файла</span>
              <span>2. Сверка условий ТЗ</span>
              <span>3. Смета Change Order</span>
            </div>
          </div>
        )}

        {validationError && (
          <div
            data-testid="validation-error-banner"
            role="alert"
            className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs font-medium text-red-800 dark:text-red-300"
          >
            {validationError}
          </div>
        )}

        <div className="pt-1 space-y-3">
          <button
            type="submit"
            data-testid="submit-audit-btn"
            disabled={isAnalyzing}
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-60 transition-colors cursor-pointer shadow-xs"
          >
            <Play className="w-4 h-4" />
            <span>
              {isAnalyzing
                ? analysisStepText || 'Выполняется сверка с ТЗ...'
                : 'Запустить юридический аудит Scope Creep'}
            </span>
          </button>

          <div className="text-[11px] text-center text-slate-500 dark:text-slate-400">
            Результат автоматически сохраняется в раздел «Библиотека работ»
          </div>
        </div>
      </form>
    </section>
  );
};
