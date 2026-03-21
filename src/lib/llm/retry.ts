export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelay = 1000,
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const isRetryable = lastError.message.includes('429') ||
          lastError.message.includes('overloaded') ||
          lastError.message.includes('rate') ||
          lastError.message.includes('529');
        if (!isRetryable) throw lastError;
        await new Promise((r) => setTimeout(r, baseDelay * (attempt + 1)));
      }
    }
  }
  throw lastError;
}
