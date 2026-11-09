import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestJson, ApiError } from '../src/http.mjs';

const jsonResponse = (status, body, headers = {}) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

test('returns parsed JSON on success', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return jsonResponse(200, { ok: true });
  };
  const { status, json } = await requestJson({
    url: 'https://example.com/x',
    fetchImpl,
    timeoutMs: 1000,
    maxRetries: 0,
  });
  assert.equal(status, 200);
  assert.deepEqual(json, { ok: true });
  assert.equal(calls[0].init.method, 'GET');
});

test('sends JSON body and custom headers', async () => {
  let seen;
  const fetchImpl = async (url, init) => {
    seen = init;
    return jsonResponse(200, {});
  };
  await requestJson({
    url: 'https://example.com/x',
    method: 'POST',
    headers: { Authorization: 'Bearer secret' },
    body: { a: 1 },
    fetchImpl,
    timeoutMs: 1000,
    maxRetries: 0,
  });
  assert.equal(seen.headers.Authorization, 'Bearer secret');
  assert.equal(seen.headers['Content-Type'], 'application/json');
  assert.equal(seen.body, '{"a":1}');
});

test('retries on 429 honoring Retry-After, then succeeds', async () => {
  let attempts = 0;
  const sleeps = [];
  const fetchImpl = async () => {
    attempts += 1;
    if (attempts === 1) return jsonResponse(429, { error: 'slow down' }, { 'Retry-After': '0' });
    return jsonResponse(200, { done: true });
  };
  const { json } = await requestJson({
    url: 'https://example.com/x',
    fetchImpl,
    timeoutMs: 1000,
    maxRetries: 3,
    sleep: async (ms) => sleeps.push(ms),
  });
  assert.equal(attempts, 2);
  assert.deepEqual(json, { done: true });
  assert.equal(sleeps.length, 1);
});

test('retries on 503 with backoff then throws ApiError after exhausting retries', async () => {
  let attempts = 0;
  const fetchImpl = async () => {
    attempts += 1;
    return jsonResponse(503, 'upstream unavailable');
  };
  await assert.rejects(
    requestJson({
      url: 'https://example.com/x',
      fetchImpl,
      timeoutMs: 1000,
      maxRetries: 2,
      sleep: async () => {},
    }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 503);
      assert.match(error.message, /HTTP 503/);
      return true;
    }
  );
  assert.equal(attempts, 3); // initial + 2 retries
});

test('does not retry non-retryable 400', async () => {
  let attempts = 0;
  const fetchImpl = async () => {
    attempts += 1;
    return jsonResponse(400, { error: 'bad request' });
  };
  await assert.rejects(
    requestJson({ url: 'https://example.com/x', fetchImpl, timeoutMs: 1000, maxRetries: 3, sleep: async () => {} }),
    ApiError
  );
  assert.equal(attempts, 1);
});

test('retries network errors', async () => {
  let attempts = 0;
  const fetchImpl = async () => {
    attempts += 1;
    if (attempts < 3) throw new TypeError('fetch failed');
    return jsonResponse(200, { ok: 1 });
  };
  const { json } = await requestJson({
    url: 'https://example.com/x',
    fetchImpl,
    timeoutMs: 1000,
    maxRetries: 3,
    sleep: async () => {},
  });
  assert.deepEqual(json, { ok: 1 });
  assert.equal(attempts, 3);
});

test('sanitizes secrets in error messages', async () => {
  const fetchImpl = async () =>
    jsonResponse(400, 'invalid token: Bearer abc123secret and api_key="sk-live-999"');
  await assert.rejects(
    requestJson({ url: 'https://example.com/x', fetchImpl, timeoutMs: 1000, maxRetries: 0 }),
    (error) => {
      assert.doesNotMatch(error.message, /abc123secret/);
      assert.doesNotMatch(error.message, /sk-live-999/);
      return true;
    }
  );
});
