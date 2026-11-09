import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLlmClient } from '../src/llm.mjs';
import { loadConfig } from '../src/config.mjs';
import { OpenAiError } from '../src/openai.mjs';

const BASE_ENV = {
  GROQ_API_KEY: 'gsk-test',
  DEVIN_API_KEY: 'k',
  DEVIN_ORG_ID: 'org-x',
  TASK_DESCRIPTION: 't',
  TASK_ACCEPTANCE_CRITERIA: 'c',
};

function groqConfig() {
  return loadConfig(BASE_ENV);
}

function okPayload(text) {
  return {
    output: [{ type: 'message', content: [{ type: 'output_text', text }] }],
  };
}

test('groq provider posts to api.groq.com/openai/v1/responses without store flag', async () => {
  const captured = {};
  const llm = createLlmClient(groqConfig(), {
    timeoutMs: 1000,
    maxRetries: 0,
    fetchImpl: async (url, init) => {
      captured.url = url;
      captured.init = init;
      captured.body = JSON.parse(init.body);
      return new Response(JSON.stringify(okPayload('{"verdict":"approve"}')), { status: 200 });
    },
  });
  const result = await llm.structured({ instructions: 'i', input: 'x', schemaName: 's', schema: { type: 'object' } });
  assert.equal(result.verdict, 'approve');
  assert.equal(captured.url, 'https://api.groq.com/openai/v1/responses');
  assert.equal(captured.init.headers.Authorization, 'Bearer gsk-test');
  assert.equal(captured.body.model, 'openai/gpt-oss-120b');
  assert.equal('store' in captured.body, false); // Groq: no store field sent
  assert.equal(captured.body.text.format.type, 'json_schema');
});

test('openai provider still sends store:false and hits api.openai.com', async () => {
  const config = loadConfig({ ...BASE_ENV, LLM_PROVIDER: 'openai', OPENAI_API_KEY: 'sk-x', GROQ_API_KEY: '' });
  const captured = {};
  const llm = createLlmClient(config, {
    timeoutMs: 1000,
    maxRetries: 0,
    fetchImpl: async (url, init) => {
      captured.url = url;
      captured.body = JSON.parse(init.body);
      return new Response(JSON.stringify(okPayload('{"a":1}')), { status: 200 });
    },
  });
  await llm.structured({ instructions: '', input: '', schemaName: 's', schema: { type: 'object' } });
  assert.equal(captured.url, 'https://api.openai.com/v1/responses');
  assert.equal(captured.body.store, false);
});

test('malformed JSON output raises OpenAiError', async () => {
  const llm = createLlmClient(groqConfig(), {
    timeoutMs: 1000,
    maxRetries: 0,
    fetchImpl: async () => new Response(JSON.stringify(okPayload('{bad json')), { status: 200 }),
  });
  await assert.rejects(
    llm.structured({ instructions: '', input: '', schemaName: 's', schema: {} }),
    OpenAiError
  );
});

test('429 rate limit is retried then surfaces error', async () => {
  let attempts = 0;
  const sleeps = [];
  const llm = createLlmClient(groqConfig(), {
    timeoutMs: 1000,
    maxRetries: 2,
    sleep: async (ms) => sleeps.push(ms),
    fetchImpl: async () => {
      attempts += 1;
      return new Response(JSON.stringify({ error: { message: 'rate limit', code: 'rate_limit_exceeded' } }), {
        status: 429,
        headers: { 'Retry-After': '0' },
      });
    },
  });
  await assert.rejects(
    llm.structured({ instructions: '', input: '', schemaName: 's', schema: {} }),
    /HTTP 429/
  );
  assert.equal(attempts, 3);
  assert.equal(sleeps.length, 2);
});

test('401 auth failure is not retried', async () => {
  let attempts = 0;
  const llm = createLlmClient(groqConfig(), {
    timeoutMs: 1000,
    maxRetries: 3,
    sleep: async () => {},
    fetchImpl: async () => {
      attempts += 1;
      return new Response(JSON.stringify({ error: { message: 'invalid api key' } }), { status: 401 });
    },
  });
  await assert.rejects(
    llm.structured({ instructions: '', input: '', schemaName: 's', schema: {} }),
    /HTTP 401/
  );
  assert.equal(attempts, 1);
});

test('input token budget guard rejects oversized prompts before any HTTP call', async () => {
  const { LlmBudgetError, estimateTokens, maxInputTokens } = await import('../src/llm.mjs');
  assert.equal(maxInputTokens({}), 5000);
  assert.ok(estimateTokens('x'.repeat(3500)) === 1000);
  let called = false;
  const llm = createLlmClient(groqConfig(), {
    timeoutMs: 1000, maxRetries: 0,
    fetchImpl: async () => { called = true; return new Response('{}', { status: 200 }); },
  }, { ORCHESTRATOR_MAX_INPUT_TOKENS: '10' });
  await assert.rejects(
    llm.structured({ instructions: 'i'.repeat(100), input: 'x'.repeat(100), schemaName: 's', schema: {} }),
    LlmBudgetError
  );
  assert.equal(called, false);
});
