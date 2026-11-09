// Minimal JSON-over-HTTP client with timeouts, retries, rate-limit handling
// and error reporting. Never logs request headers or bodies, so API keys
// cannot leak into workflow logs.

export class ApiError extends Error {
  constructor(message, { status, url, attempt }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
    this.attempt = attempt;
  }
}

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function sanitizeBody(text) {
  if (!text) return '';
  const clipped = text.length > 500 ? `${text.slice(0, 500)}…` : text;
  // Strip anything that looks like a bearer token or key= value.
  return clipped
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/("?(?:api[_-]?key|authorization|token)"?\s*[:=]\s*")[^"]+"/gi, '$1[redacted]"');
}

function retryDelayMs(response, attempt) {
  const retryAfter = response?.headers?.get?.('retry-after');
  if (retryAfter) {
    const seconds = Number.parseFloat(retryAfter);
    if (Number.isFinite(seconds)) return Math.min(seconds * 1000, 120000);
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) return Math.min(Math.max(date - Date.now(), 0), 120000);
  }
  return Math.min(1000 * 2 ** attempt, 30000);
}

/**
 * @param {object} opts
 * @param {string} opts.url
 * @param {string} [opts.method]
 * @param {object} [opts.headers]
 * @param {unknown} [opts.body]  JSON-serialisable
 * @param {number} opts.timeoutMs
 * @param {number} opts.maxRetries
 * @param {typeof fetch} [opts.fetchImpl]
 * @param {(ms:number)=>Promise<void>} [opts.sleep]
 */
export async function requestJson(opts) {
  const {
    url,
    method = 'GET',
    headers = {},
    body,
    timeoutMs,
    maxRetries,
    fetchImpl = fetch,
    sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  } = opts;

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(url, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      lastError = new ApiError(
        `Network error calling ${method} ${url}: ${error instanceof Error ? error.message : String(error)}`,
        { status: 0, url, attempt }
      );
      if (attempt < maxRetries) {
        await sleep(Math.min(1000 * 2 ** attempt, 30000));
        continue;
      }
      throw lastError;
    }

    if (response.ok) {
      const text = await response.text();
      if (!text) return { status: response.status, json: null };
      try {
        return { status: response.status, json: JSON.parse(text) };
      } catch {
        throw new ApiError(`Non-JSON response (${response.status}) from ${method} ${url}: ${sanitizeBody(text)}`, {
          status: response.status,
          url,
          attempt,
        });
      }
    }

    const text = await response.text().catch(() => '');
    lastError = new ApiError(
      `${method} ${url} failed: HTTP ${response.status} ${sanitizeBody(text)}`,
      { status: response.status, url, attempt }
    );

    if (!RETRYABLE_STATUS.has(response.status) || attempt >= maxRetries) {
      throw lastError;
    }
    await sleep(retryDelayMs(response, attempt));
  }
  throw lastError;
}
