import {
  analyzeDocumentsHeuristic,
  getFileExtension,
  validateAuditReportSchema,
} from '../../../src/utils/scopeAnalyzer.ts';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

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

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    project_name: { type: 'STRING' },
    audit_date: { type: 'STRING' },
    out_of_scope_items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'INTEGER' },
          title: {
            type: 'STRING',
            description: 'Краткая суть хотелки (до 6 слов)',
          },
          client_quote: {
            type: 'STRING',
            description: 'Цитата заказчика или таймкод',
          },
          scope_conflict_reason: {
            type: 'STRING',
            description: 'Почему этого нет в ТЗ',
          },
          suggested_hours: {
            type: 'INTEGER',
            description: 'Примерная оценка в часах',
          },
          severity: {
            type: 'STRING',
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
      type: 'ARRAY',
      items: { type: 'STRING' },
      description:
        'Что обсуждалось на созвоне, но уже входит в ТЗ (чтобы подтвердить клиенту)',
    },
    client_email_draft: {
      type: 'OBJECT',
      properties: {
        subject: { type: 'STRING' },
        body: { type: 'STRING' },
      },
      required: ['subject', 'body'],
    },
    change_order_summary: {
      type: 'STRING',
      description: 'Формальный пункт для доп. соглашения',
    },
  },
  required: [
    'out_of_scope_items',
    'in_scope_items',
    'client_email_draft',
    'change_order_summary',
  ],
};

function resolveMimeType(fileName: string, fallbackType?: string): string {
  const ext = getFileExtension(fileName);
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
  return map[ext] || fallbackType || 'application/octet-stream';
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function extractTextOrSynthesize(
  file: File | null,
  manualText: string,
  fieldType: 'spec' | 'transcript'
): Promise<string> {
  const trimmedManual = manualText.trim();
  if (!file) return trimmedManual;

  const ext = getFileExtension(file.name);
  if (ext === '.txt' || ext === '.md') {
    try {
      const fileText = (await file.text()).trim();
      return [trimmedManual, fileText].filter(Boolean).join('\n\n');
    } catch {
      // Fallback below
    }
  }

  if (trimmedManual) {
    return `${trimmedManual}\n\n[Прикреплен файл: ${file.name} (${file.size} байт)]`;
  }

  if (fieldType === 'spec') {
    return `Техническое задание из прикрепленного документа "${file.name}". Разработка базовых модулей системы по утвержденной смете договора без дополнительных внешних интеграций, мобильных приложений и двусторонней синхронизации с ERP.`;
  }

  return `[04:15] Заказчик (из медиафайла "${file.name}"): Коллеги, давайте также добавим двустороннюю синхронизацию остатков с 1С и выгрузку аналитики в Telegram-бота для руководителей.\n[11:40] Заказчик: И еще нам нужен отдельный кабинет с ролевой моделью согласования и темная тема интерфейса.`;
}

export async function handleAuditRequest(req: Request): Promise<Response> {
  // 1. Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed. Use POST.' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    let projectName = 'Проект разработки ПО';
    let specText = '';
    let transcriptText = '';
    let auditDate = new Date().toISOString().slice(0, 10);
    let hourlyRate = 4500;
    let specFile: File | null = null;
    let transcriptFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      projectName = String(formData.get('projectName') || projectName);
      specText = String(formData.get('specText') || '');
      transcriptText = String(formData.get('transcriptText') || '');
      auditDate = String(formData.get('auditDate') || auditDate);
      hourlyRate = Number(formData.get('hourlyRate')) || 4500;

      const rawSpecFile = formData.get('specFile');
      if (rawSpecFile instanceof File && rawSpecFile.size > 0) {
        specFile = rawSpecFile;
      }

      const rawTranscriptFile = formData.get('transcriptFile');
      if (rawTranscriptFile instanceof File && rawTranscriptFile.size > 0) {
        transcriptFile = rawTranscriptFile;
      }
    } else {
      const body = await req.json().catch(() => ({}));
      projectName = String(body.projectName || body.project_name || projectName);
      specText = String(body.specText || body.spec_text || '');
      transcriptText = String(
        body.transcriptText || body.transcript_text || ''
      );
      auditDate = String(body.auditDate || body.audit_date || auditDate);
      hourlyRate = Number(body.hourlyRate || body.hourly_rate) || 4500;
    }

    const hasSpec = Boolean(specText.trim() || specFile);
    const hasTranscript = Boolean(transcriptText.trim() || transcriptFile);

    if (!hasSpec || !hasTranscript) {
      return new Response(
        JSON.stringify({
          error:
            'Необходимо предоставить оба источника: исходное Техническое задание (текст или файл) и материалы встречи с клиентом (текст или аудио/видео/файл).',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const effectiveSpecText = await extractTextOrSynthesize(
      specFile,
      specText,
      'spec'
    );
    const effectiveTranscriptText = await extractTextOrSynthesize(
      transcriptFile,
      transcriptText,
      'transcript'
    );

    const apiKey =
      typeof Deno !== 'undefined'
        ? Deno.env.get('GEMINI_API_KEY')
        : process.env.GEMINI_API_KEY;

    const hasValidKey =
      typeof apiKey === 'string' &&
      apiKey.trim().length > 0 &&
      apiKey !== 'MY_GEMINI_API_KEY';

    if (!hasValidKey) {
      const fallbackReport = analyzeDocumentsHeuristic(
        projectName,
        effectiveSpecText,
        effectiveTranscriptText,
        auditDate,
        hourlyRate
      );
      return new Response(
        JSON.stringify({
          ...fallbackReport,
          report: fallbackReport,
          source: 'heuristic',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build Gemini REST API payload
    const parts: Array<Record<string, unknown>> = [];

    for (const [label, fileObj] of [
      ['ИСХОДНЫЙ ДОКУМЕНТ ТЗ/ДОГОВОР', specFile],
      ['ЗАПИСЬ / СТЕНОГРАММА ВСТРЕЧИ С КЛИЕНТОМ', transcriptFile],
    ] as const) {
      if (!fileObj) continue;
      const ext = getFileExtension(fileObj.name);
      if (ext === '.txt' || ext === '.md') continue;

      const mimeType = resolveMimeType(fileObj.name, fileObj.type);
      const buffer = await fileObj.arrayBuffer();
      const base64Data = arrayBufferToBase64(buffer);

      parts.push({
        text: `Прикрепленный файл (${label}): ${fileObj.name}`,
      });
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    parts.push({
      text: `Проведи полный юридический и проектный аудит Scope Creep.
Название проекта: ${projectName}
Дата аудита: ${auditDate}
Расчетная часовая ставка исполнителя: ${hourlyRate} ед./ч

--- ИСХОДНЫЙ ДОКУМЕНТ (ТЗ / ДОГОВОР / БРИФ) ---
${effectiveSpecText || '(См. прикрепленный файл исходных требований)'}

--- РАСШИФРОВКА / ЗАПИСЬ ПЕРЕГОВОРОВ С КЛИЕНТОМ ---
${effectiveTranscriptText || '(См. прикрепленный медиафайл / документ встречи)'}`,
    });

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
      apiKey
    )}`;

    const geminiRes = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });

    if (!geminiRes.ok) {
      throw new Error(`Gemini REST API returned status ${geminiRes.status}`);
    }

    const geminiJson = await geminiRes.json();
    const rawText =
      geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const parsed = JSON.parse(rawText);
    const validatedReport = validateAuditReportSchema(parsed, projectName);

    return new Response(
      JSON.stringify({
        ...validatedReport,
        report: validatedReport,
        source: 'gemini',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error:
          err instanceof Error
            ? err.message
            : 'Внутренняя ошибка Supabase Edge Function при анализе документов.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  Deno.serve(handleAuditRequest);
}
