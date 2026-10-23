import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  GeminiServerError,
  requestGeminiFromServer,
} from '../src/server/geminiServer.ts';
import {
  GeminiRequestError,
  requestGeminiContent,
} from '../../supabase/functions/_shared/gemini.ts';

const MAIN_KEY = 'test-main-placeholder';
const BACKUP_KEY = 'test-backup-placeholder';
const MODEL = 'gemini-3.6-flash';
const SUCCESS_BODY = {
  candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
};

function response(body, status = 200) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const transports = [
  {
    name: 'Expo server helper',
    request: requestGeminiFromServer,
    ErrorType: GeminiServerError,
  },
  {
    name: 'Supabase Edge helper',
    request: requestGeminiContent,
    ErrorType: GeminiRequestError,
  },
];

for (const transport of transports) {
  test(`${transport.name}: main-key success does not use the backup`, async () => {
    const calls = [];
    const result = await transport.request({
      apiKey: MAIN_KEY,
      backupApiKey: BACKUP_KEY,
      model: MODEL,
      body: { contents: [] },
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), headers: new Headers(init?.headers) });
        return response(SUCCESS_BODY);
      },
    });

    assert.deepEqual(result, SUCCESS_BODY);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].headers.get('x-goog-api-key'), MAIN_KEY);
    assert.equal(calls[0].url.includes(MAIN_KEY), false);
    assert.equal(calls[0].url.includes(BACKUP_KEY), false);
    assert.match(calls[0].url, /gemini-3\.6-flash:generateContent$/);
  });

  test(`${transport.name}: quota failure retries exactly once with the backup`, async () => {
    const usedKeys = [];
    const result = await transport.request({
      apiKey: MAIN_KEY,
      backupApiKey: BACKUP_KEY,
      model: MODEL,
      body: { contents: [] },
      fetchImpl: async (_url, init) => {
        usedKeys.push(new Headers(init?.headers).get('x-goog-api-key'));
        return usedKeys.length === 1
          ? response({ error: { status: 'RESOURCE_EXHAUSTED' } }, 429)
          : response(SUCCESS_BODY);
      },
    });

    assert.deepEqual(result, SUCCESS_BODY);
    assert.deepEqual(usedKeys, [MAIN_KEY, BACKUP_KEY]);
  });

  test(`${transport.name}: invalid main key retries exactly once with the backup`, async () => {
    const usedKeys = [];
    await transport.request({
      apiKey: MAIN_KEY,
      backupApiKey: BACKUP_KEY,
      model: MODEL,
      body: { contents: [] },
      fetchImpl: async (_url, init) => {
        usedKeys.push(new Headers(init?.headers).get('x-goog-api-key'));
        return usedKeys.length === 1
          ? response({ error: { status: 'INVALID_ARGUMENT', message: 'API_KEY_INVALID' } }, 400)
          : response(SUCCESS_BODY);
      },
    });

    assert.deepEqual(usedKeys, [MAIN_KEY, BACKUP_KEY]);
  });

  test(`${transport.name}: ordinary request errors do not use the backup`, async () => {
    const usedKeys = [];
    await assert.rejects(
      transport.request({
        apiKey: MAIN_KEY,
        backupApiKey: BACKUP_KEY,
        model: MODEL,
        body: { contents: [] },
        fetchImpl: async (_url, init) => {
          usedKeys.push(new Headers(init?.headers).get('x-goog-api-key'));
          return response({ error: { message: 'Malformed request body' } }, 400);
        },
      }),
      transport.ErrorType
    );

    assert.deepEqual(usedKeys, [MAIN_KEY]);
  });

  test(`${transport.name}: final errors never contain either key`, async () => {
    let caught;
    try {
      await transport.request({
        apiKey: MAIN_KEY,
        backupApiKey: BACKUP_KEY,
        model: MODEL,
        body: { contents: [] },
        fetchImpl: async () => response({ error: { status: 'RESOURCE_EXHAUSTED' } }, 429),
      });
    } catch (error) {
      caught = error;
    }

    assert.ok(caught instanceof transport.ErrorType);
    assert.equal(String(caught).includes(MAIN_KEY), false);
    assert.equal(String(caught).includes(BACKUP_KEY), false);
  });
}

test('client code contains no public Gemini secret or direct Gemini endpoint', async () => {
  const clientFiles = [
    'src/lib/services/geminiService.ts',
    'src/lib/services/scannerService.ts',
    'src/features/bin/BinScannerScreen.tsx',
    'src/features/bin/BinUploadScreen.tsx',
  ];

  for (const file of clientFiles) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.equal(source.includes('EXPO_PUBLIC_GEMINI'), false, `${file} contains a public Gemini variable`);
    assert.equal(
      source.includes('generativelanguage.googleapis.com'),
      false,
      `${file} calls Gemini directly`
    );
  }
});

test('environment examples expose names only', async () => {
  const exampleFiles = [
    new URL('../.env.example', import.meta.url),
    new URL('../../supabase/functions/.env.example', import.meta.url),
  ];

  for (const file of exampleFiles) {
    const lines = (await readFile(file, 'utf8'))
      .split(/\r?\n/)
      .filter((line) => line.startsWith('GEMINI_'));
    assert.deepEqual(lines, [
      'GEMINI_API_KEY=',
      'GEMINI_API_KEY_BACKUP=',
      'GEMINI_MODEL=',
    ]);
  }
});
