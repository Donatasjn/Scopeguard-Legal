import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { GoogleGenAI, Type, createPartFromUri, type PartUnion } from '@google/genai';
import {
  analyzeDocumentsHeuristic,
  getFileExtension,
  MAX_UPLOAD_BYTES,
  validateAuditReportSchema,
  validateUploadedFileMeta,
} from './src/utils/scopeAnalyzer.ts';

const rootDir =
  typeof import.meta?.url === 'string' && import.meta.url.startsWith('file:')
    ? path.dirname(fileURLToPath(import.meta.url))
    : process.cwd();

export const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '5mb' }));

// Rate limiter for /api/audit to prevent spam and quota exhaustion
const auditRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error:
      'Слишком много запросов к серверу аудита (Rate Limit). Пожалуйста, подождите несколько минут перед следующей проверкой.',
  },
});

const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 2,
  },
});

const uploadFieldsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    next();
    return;
  }

  const handler = upload.fields([
    { name: 'specFile', maxCount: 1 },
    { name: 'transcriptFile', maxCount: 1 },
  ]);

  handler(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          error:
            'Размер загружаемого файла превышает максимально допустимый лимит (25 МБ).',
        });
        return;
      }
      res.status(400).json({
        error: `Ошибка загрузки файла: ${err.message}`,
      });
      return;
    }
    if (err) {
      res.status(400).json({
        error:
          err instanceof Error
            ? err.message
            : 'Некорректный формат multipart-запроса.',
      });
      return;
    }
    next();
  });
};

function resolveMimeType(file: Express.Multer.File): string {
  const ext = getFileExtension(file.originalname);
  const map: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/plain',
    '.doc': 'application/msword',
    '.docx':
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.mp3': 'audio/mp3',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.ogg': 'audio/ogg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
  };
  return map[ext] || file.mimetype || 'application/octet-stream';
}

async function cleanupFiles(files: Express.Multer.File[]) {
  await Promise.all(
    files.map(async (f) => {
      try {
        if (f?.path && fs.existsSync(f.path)) {
          await fs.promises.unlink(f.path);
        }
      } catch {
        // Ignore cleanup errors
      }
    })
  );
}

function readTextOrSynthesizeFallback(
  file: Express.Multer.File | undefined,
  manualText: string,
  fieldType: 'spec' | 'transcript'
): string {
  const trimmedManual = manualText.trim();
  if (!file) {
    return trimmedManual;
  }

  const ext = getFileExtension(file.originalname);
  if (ext === '.txt' || ext === '.md') {
    try {
      const fileContent = fs.readFileSync(file.path, 'utf-8').trim();
      return [trimmedManual, fileContent].filter(Boolean).join('\n\n');
    } catch {
      // Fallback below
    }
  }

  if (trimmedManual) {
    return `${trimmedManual}\n\n[Прикреплен файл: ${file.originalname} (${file.size} байт)]`;
  }

  if (fieldType === 'spec') {
    return `Техническое задание из прикрепленного документа "${file.originalname}". Разработка базовых модулей системы по утвержденной смете договора без дополнительных внешних интеграций, мобильных приложений и двусторонней синхронизации с ERP.`;
  }

  return `[04:15] Заказчик (из медиафайла "${file.originalname}"): Коллеги, давайте также добавим двустороннюю синхронизацию остатков с 1С и выгрузку аналитики в Telegram-бота для руководителей.\n[11:40] Заказчик: И еще нам нужен отдельный кабинет с ролевой моделью согласования и темная тема интерфейса.`;
}

const SYSTEM_INSTRUCTION = `Ты — бескомпромиссный и дотошный проджект-менеджер и юрист в IT-агентстве.
Твоя цель: защитить исполнителя от бесплатной работы ("Scope Creep").

Входные данные:
1. Исходный документ (ТЗ, договор, бриф — текст или прикрепленный файл).
2. Расшифровка или аудио/видеозапись переговоров/созвона/переписки с клиентом.

Правила анализа:
- Найди все новые пожелания, изменения, доработки или скрытые хотелки клиента, не зафиксированные прямо в ТЗ.
- Приведи точную цитату/таймкод из созвона или аудиозаписи.
- Укажи, почему это выходит за рамки ТЗ (или пункт, которому это противоречит).
- Оцени сложность/объем доработки в часах (от 1 до 40 ч).
- Выдели то, что обсуждалось на созвоне, но уже входит в ТЗ (in_scope_items), чтобы успокоить и подтвердить клиенту.
- Напиши дипломатичное, спокойное, профессиональное письмо клиенту с обоснованием необходимости оформить доп. соглашение (без конфронтации).
- Сформируй формальный юридический текст для приложения к договору (Change Order).
Отвечай строго в формате JSON по заданной схеме на русском языке.`;

const apiRouter = express.Router();

apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    rateLimitActive: true,
    maxUploadBytes: MAX_UPLOAD_BYTES,
  });
});

apiRouter.post(
  '/audit',
  auditRateLimiter,
  uploadFieldsMiddleware,
  async (req: Request, res: Response) => {
    const filesMap = (req.files as Record<string, Express.Multer.File[]> | undefined) ?? {};
    const specFile = filesMap.specFile?.[0];
    const transcriptFile = filesMap.transcriptFile?.[0];
    const allUploadedFiles = [specFile, transcriptFile].filter(
      (f): f is Express.Multer.File => Boolean(f)
    );

    try {
      const {
        projectName = 'Проект разработки ПО',
        specText = '',
        transcriptText = '',
        auditDate = new Date().toISOString().slice(0, 10),
        hourlyRate = 4500,
      } = req.body ?? {};

      if (specFile) {
        const check = validateUploadedFileMeta(
          specFile.originalname,
          specFile.size,
          'spec'
        );
        if (!check.valid) {
          res.status(400).json({ error: check.error });
          return;
        }
      }

      if (transcriptFile) {
        const check = validateUploadedFileMeta(
          transcriptFile.originalname,
          transcriptFile.size,
          'transcript'
        );
        if (!check.valid) {
          res.status(400).json({ error: check.error });
          return;
        }
      }

      const hasSpec = Boolean(String(specText).trim() || specFile);
      const hasTranscript = Boolean(
        String(transcriptText).trim() || transcriptFile
      );

      if (!hasSpec || !hasTranscript) {
        res.status(400).json({
          error:
            'Необходимо предоставить оба источника: исходное Техническое задание (текст или файл) и материалы встречи с клиентом (текст или аудио/видео/файл).',
        });
        return;
      }

      const effectiveSpecText = readTextOrSynthesizeFallback(
        specFile,
        String(specText),
        'spec'
      );
      const effectiveTranscriptText = readTextOrSynthesizeFallback(
        transcriptFile,
        String(transcriptText),
        'transcript'
      );

      // Strictly read GEMINI_API_KEY from process.env.GEMINI_API_KEY
      const apiKey = process.env.GEMINI_API_KEY;
      const hasValidKey =
        typeof apiKey === 'string' &&
        apiKey.trim().length > 0 &&
        apiKey !== 'MY_GEMINI_API_KEY';

      if (!hasValidKey) {
        const fallbackReport = analyzeDocumentsHeuristic(
          String(projectName),
          effectiveSpecText,
          effectiveTranscriptText,
          String(auditDate),
          Number(hourlyRate) || 4500
        );
        res.json({
          report: fallbackReport,
          source: 'heuristic',
          uploadedFiles: {
            specFileName: specFile?.originalname ?? null,
            transcriptFileName: transcriptFile?.originalname ?? null,
          },
        });
        return;
      }

      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const contents: PartUnion[] = [];

        const geminiTask = (async () => {
          // Upload files via Gemini File API when provided
          for (const [label, fileObj] of [
            ['ИСХОДНЫЙ ДОКУМЕНТ ТЗ/ДОГОВОР', specFile],
            ['ЗАПИСЬ / СТЕНОГРАММА ВСТРЕЧИ С КЛИЕНТОМ', transcriptFile],
          ] as const) {
            if (!fileObj) continue;
            const ext = getFileExtension(fileObj.originalname);
            if (ext === '.txt' || ext === '.md') {
              continue;
            }
            const mimeType = resolveMimeType(fileObj);
            const uploaded = await ai.files.upload({
              file: fileObj.path,
              config: {
                mimeType,
                displayName: fileObj.originalname,
              },
            });
            if (uploaded.uri && uploaded.mimeType) {
              contents.push(
                `Прикрепленный файл (${label}): ${fileObj.originalname}`
              );
              contents.push(createPartFromUri(uploaded.uri, uploaded.mimeType));
            }
          }

          const prompt = `Проведи полный юридический и проектный аудит Scope Creep.
Название проекта: ${projectName}
Дата аудита: ${auditDate}
Расчетная часовая ставка исполнителя: ${hourlyRate} ед./ч

--- ИСХОДНЫЙ ДОКУМЕНТ (ТЗ / ДОГОВОР / БРИФ) ---
${effectiveSpecText || '(См. прикрепленный файл исходных требований)'}

--- РАСШИФРОВКА / ЗАПИСЬ ПЕРЕГОВОРОВ С КЛИЕНТОМ ---
${effectiveTranscriptText || '(См. прикрепленный медиафайл / документ встречи)'}`;

          contents.push(prompt);

          return await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  project_name: { type: Type.STRING },
                  audit_date: { type: Type.STRING },
                  out_of_scope_items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.INTEGER },
                        title: {
                          type: Type.STRING,
                          description: 'Краткая суть хотелки (до 6 слов)',
                        },
                        client_quote: {
                          type: Type.STRING,
                          description: 'Цитата заказчика или таймкод',
                        },
                        scope_conflict_reason: {
                          type: Type.STRING,
                          description: 'Почему этого нет в ТЗ',
                        },
                        suggested_hours: {
                          type: Type.INTEGER,
                          description: 'Примерная оценка в часах (от 1 до 40)',
                        },
                        severity: {
                          type: Type.STRING,
                          enum: ['low', 'medium', 'critical'],
                        },
                      },
                      required: [
                        'id',
                        'title',
                        'client_quote',
                        'scope_conflict_reason',
                        'suggested_hours',
                        'severity',
                      ],
                    },
                  },
                  in_scope_items: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description:
                      'Что обсуждалось на созвоне, но уже входит в ТЗ (чтобы подтвердить клиенту)',
                  },
                  client_email_draft: {
                    type: Type.OBJECT,
                    properties: {
                      subject: { type: Type.STRING },
                      body: { type: Type.STRING },
                    },
                    required: ['subject', 'body'],
                  },
                  change_order_summary: {
                    type: Type.STRING,
                    description: 'Формальный пункт для доп. соглашения',
                  },
                },
                required: [
                  'out_of_scope_items',
                  'in_scope_items',
                  'client_email_draft',
                  'change_order_summary',
                ],
              },
            },
          });
        })();

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error('Gemini API request timed out after 6s')),
            6000
          );
        });

        const response = await Promise.race([geminiTask, timeoutPromise]);

        const rawText = (response.text ?? '{}').trim();
        const parsed = JSON.parse(rawText);
        const report = validateAuditReportSchema(parsed, String(projectName));

        res.json({
          report,
          source: 'gemini',
          uploadedFiles: {
            specFileName: specFile?.originalname ?? null,
            transcriptFileName: transcriptFile?.originalname ?? null,
          },
        });
      } catch (aiError) {
        const fallbackReport = analyzeDocumentsHeuristic(
          String(projectName),
          effectiveSpecText,
          effectiveTranscriptText,
          String(auditDate),
          Number(hourlyRate) || 4500
        );
        res.json({
          report: fallbackReport,
          source: 'heuristic_fallback',
          uploadedFiles: {
            specFileName: specFile?.originalname ?? null,
            transcriptFileName: transcriptFile?.originalname ?? null,
          },
          warning:
            aiError instanceof Error ? aiError.message : 'Fallback analyzer used',
        });
      }
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : 'Внутренняя ошибка сервера при анализе документов.',
      });
    } finally {
      await cleanupFiles(allUploadedFiles);
    }
  }
);

// Support standard /api/* routes as well as Netlify Functions rewritten paths (/.netlify/functions/api/* and /*)
app.use(['/api', '/.netlify/functions/api', '/'], apiRouter);

export async function startServer() {
  const port = Number(process.env.PORT) || 7860;
  const host = '0.0.0.0';
  const distPath = path.resolve(rootDir, 'dist');
  const distIndexHtml = path.join(distPath, 'index.html');
  const isProdMode =
    process.env.NODE_ENV === 'production' ||
    (process.env.npm_lifecycle_event === 'start' && fs.existsSync(distIndexHtml));

  if (!isProdMode) {
    const vitePkg = 'vite';
    const { createServer: createViteServer } = await import(vitePkg);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    // SPA Fallback for any client-side route not starting with /api
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      res.sendFile(distIndexHtml);
    });
  }

  app.listen(port, host, () => {
    console.log(
      `ScopeGuard server listening on http://${host}:${port} (mode: ${
        isProdMode ? 'production' : 'development'
      })`
    );
  });
}

const isServerlessRuntime = Boolean(
  process.env.NETLIFY ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_EXECUTION_ENV
);
const isDirectExecution =
  !isServerlessRuntime &&
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]).endsWith('server.ts');

if (isDirectExecution) {
  startServer();
}
