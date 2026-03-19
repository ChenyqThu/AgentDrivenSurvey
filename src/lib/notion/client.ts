import { Client } from '@notionhq/client';

let _client: Client | null = null;

export function getNotionClient(): Client {
  if (_client) return _client;

  const token = process.env.NOTION_API_TOKEN;
  if (!token) {
    throw new Error('NOTION_API_TOKEN environment variable is not set');
  }

  _client = new Client({ auth: token });
  return _client;
}

/**
 * Retry wrapper for Notion API calls with 429 backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const isRateLimit =
        err instanceof Object &&
        'status' in err &&
        (err as { status: number }).status === 429;

      if (!isRateLimit || attempt === maxRetries) {
        throw err;
      }

      const retryAfter =
        err instanceof Object && 'headers' in err
          ? Number((err as { headers: Record<string, string> }).headers?.['retry-after']) || 1
          : 1;
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
    }
  }
  throw new Error('Unreachable');
}
