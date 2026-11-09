import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createDevinClient,
  isTerminalStatus,
  sessionOutcome,
  DevinApiError,
} from '../src/devin.mjs';

function mockFetch(handler, captured = []) {
  return async (url, init) => {
    captured.push({ url, init, body: init?.body ? JSON.parse(init.body) : undefined });
    const result = handler(url, init);
    return new Response(JSON.stringify(result.body ?? result), {
      status: result.httpStatus ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

function client(fetchImpl) {
  return createDevinClient({
    apiKey: 'cog-test',
    orgId: 'org-abc',
    baseUrl: 'https://api.devin.ai',
    timeoutMs: 1000,
    maxRetries: 0,
    fetchImpl,
  });
}

test('createSession posts to v3 org sessions with prompt, repos, limits and structured output', async () => {
  const captured = [];
  const c = client(mockFetch(() => ({ session_id: 'devin-1', url: 'https://app.devin.ai/sessions/devin-1', status: 'new' }), captured));
  const res = await c.createSession({
    prompt: 'do the thing',
    repos: ['architmittal2006/Cracked1'],
    devinMode: 'normal',
    maxAcuLimit: 5,
    structuredOutputSchema: { type: 'object' },
  });
  assert.equal(res.session_id, 'devin-1');
  const call = captured[0];
  assert.equal(call.url, 'https://api.devin.ai/v3/organizations/org-abc/sessions');
  assert.equal(call.init.headers.Authorization, 'Bearer cog-test');
  assert.equal(call.init.method, 'POST');
  assert.equal(call.body.prompt, 'do the thing');
  assert.deepEqual(call.body.repos, ['architmittal2006/Cracked1']);
  assert.equal(call.body.devin_mode, 'normal');
  assert.equal(call.body.max_acu_limit, 5);
  assert.equal(call.body.structured_output_required, true);
  assert.deepEqual(call.body.structured_output_schema, { type: 'object' });
});

test('getSession hits the session detail endpoint', async () => {
  const captured = [];
  const c = client(mockFetch(() => ({ session_id: 'devin-1', status: 'running', status_detail: 'working' }), captured));
  const res = await c.getSession('devin-1');
  assert.equal(res.status, 'running');
  assert.equal(captured[0].url, 'https://api.devin.ai/v3/organizations/org-abc/sessions/devin-1');
  assert.equal(captured[0].init.method, 'GET');
});

test('sendMessage posts message to session messages endpoint', async () => {
  const captured = [];
  const c = client(mockFetch(() => ({ session_id: 'devin-1', status: 'running' }), captured));
  await c.sendMessage('devin-1', 'please fix X');
  assert.equal(captured[0].url, 'https://api.devin.ai/v3/organizations/org-abc/sessions/devin-1/messages');
  assert.equal(captured[0].body.message, 'please fix X');
});

test('wraps HTTP failures in DevinApiError', async () => {
  const c = client(async () => new Response('{"detail":"nope"}', { status: 403 }));
  await assert.rejects(c.getSession('devin-1'), DevinApiError);
});

test('sessionOutcome maps statuses correctly', () => {
  assert.equal(isTerminalStatus({ status: 'running' }), false);
  assert.deepEqual(sessionOutcome({ status: 'running', status_detail: 'working' }).done, false);
  assert.deepEqual(sessionOutcome({ status: 'exit', status_detail: 'finished' }), { done: true, success: true, reason: 'finished' });
  assert.equal(sessionOutcome({ status: 'exit', status_detail: 'user_request' }).success, false);
  assert.equal(sessionOutcome({ status: 'error' }).success, false);
  assert.equal(sessionOutcome({ status: 'suspended', status_detail: 'out_of_credits' }).success, false);
  assert.equal(sessionOutcome({ status: 'running', status_detail: 'waiting_for_approval' }).done, true);
  assert.equal(sessionOutcome({ status: 'running', status_detail: 'waiting_for_user' }).done, true);
  assert.equal(isTerminalStatus({ status: 'exit' }), true);
  assert.equal(isTerminalStatus({ status: 'suspended' }), true);
});
