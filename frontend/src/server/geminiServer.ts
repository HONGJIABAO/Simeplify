/**
 * Server-only Gemini transport for Expo API routes.
 * Do not import this module from screens, components, or client services.
 */

export interface GeminiServerRequestOptions {
  apiKey: string;
  backupApiKey?: string;
  model: string;
  body: unknown;
  fetchImpl?: typeof fetch;
}

export type GeminiServerFailureCode =
  | 'quota'
  | 'invalid_key'
  | 'http_error'
  | 'network_error'
  | 'invalid_response';

export class GeminiServerError extends Error {
  readonly status: number | null;
  readonly code: GeminiServerFailureCode;

  constructor(code: GeminiServerFailureCode, status: number | null = null) {
    super(status === null ? `Gemini request failed (${code})` : `Gemini request failed (${status}, ${code})`);
    this.name = 'GeminiServerError';
    this.status = status;
    this.code = code;
  }
}

function classifyFailure(status: number, responseBody: string): GeminiServerFailureCode {
  const normalized = responseBody.toLowerCase();

  if (
    status === 429 ||
    normalized.includes('resource_exhausted') ||
    normalized.includes('quota')
  ) {
    return 'quota';
  }

  if (
    status === 401 ||
    normalized.includes('api_key_invalid') ||
    normalized.includes('api key not valid') ||
    normalized.includes('invalid api key') ||
    normalized.includes('unauthenticated')
  ) {
    return 'invalid_key';
  }

  return 'http_error';
}

export function shouldRetryGeminiServerWithBackup(status: number, responseBody: string): boolean {
  const failure = classifyFailure(status, responseBody);
  return failure === 'quota' || failure === 'invalid_key';
}

export async function requestGeminiFromServer(
  options: GeminiServerRequestOptions
): Promise<any> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const keys = [options.apiKey.trim(), options.backupApiKey?.trim() || '']
    .filter((key, index, all) => Boolean(key) && all.indexOf(key) === index);

  if (keys.length === 0) {
    throw new GeminiServerError('invalid_key');
  }

  if (!options.model.trim()) {
    throw new GeminiServerError('http_error');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(options.model.trim())}:generateContent`;

  for (let index = 0; index < keys.length; index += 1) {
    let response: Response;
    try {
      response = await fetchImpl(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': keys[index],
        },
        body: JSON.stringify(options.body),
      });
    } catch {
      throw new GeminiServerError('network_error');
    }

    if (response.ok) {
      try {
        return await response.json();
      } catch {
        throw new GeminiServerError('invalid_response', response.status);
      }
    }

    const responseBody = await response.text().catch(() => '');
    const code = classifyFailure(response.status, responseBody);
    const canUseBackup =
      index === 0 &&
      keys.length > 1 &&
      shouldRetryGeminiServerWithBackup(response.status, responseBody);

    if (canUseBackup) {
      continue;
    }

    throw new GeminiServerError(code, response.status);
  }

  throw new GeminiServerError('http_error');
}
