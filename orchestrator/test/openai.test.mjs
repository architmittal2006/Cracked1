import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOpenAiClient, OpenAiError } from '../src/openai.mjs';

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict'],
  properties: { verdict: { type: 'string' } },
};

function responsesPayload(outputText) {
  return {
    id: 'resp_1',
    output: [
      {
        type: 'message',
        role: 'assistant',
        content: [{ type: 'output_text', text: outputText }],
      },
    ],
  };
}

function clientReturning(payload, captured = {}) {
  return createOpenAiClient({
    apiKey: 'sk-test',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-5-mini',
    timeoutMs: 1000,
    maxRetries: 0,
    fetchImpl: async (url, init) => {
      captured.url = url;
      captured.init = init;
      captured.body = JSON.parse(init.body);
      return new Response(JSON.stringify(payload), { status: 200 });
    },
  });
}

test('posts to /responses with bearer auth and json_schema format', async () => {
  const captured = {};
  const client = clientReturning(responsesPayload('{"verdict":"approve"}'), captured);
  const result = await client.structured({
    instructions: 'instr',
    input: 'input',
    schemaName: 'review_verdict',
    schema: SCHEMA,
  });
  assert.deepEqual(result, { verdict: 'approve' });
  assert.equal(captured.url, 'https://api.openai.com/v1/responses');
  assert.equal(captured.init.headers.Authorization, 'Bearer sk-test');
  assert.equal(captured.body.model, 'gpt-5-mini');
  assert.equal(captured.body.store, false);
  assert.equal(captured.body.text.format.type, 'json_schema');
  assert.equal(captured.body.text.format.name, 'review_verdict');
  assert.equal(captured.body.text.format.strict, true);
  assert.deepEqual(captured.body.text.format.schema, SCHEMA);
});

test('falls back to scanning output[] when output_text absent', async () => {
  const client = clientReturning(responsesPayload('{"verdict":"changes_required"}'));
  const result = await client.structured({ instructions: '', input: '', schemaName: 's', schema: SCHEMA });
  assert.equal(result.verdict, 'changes_required');
});

test('prefers top-level output_text when present', async () => {
  const client = clientReturning({ output_text: '{"verdict":"approve"}', output: [] });
  const result = await client.structured({ instructions: '', input: '', schemaName: 's', schema: SCHEMA });
  assert.equal(result.verdict, 'approve');
});

test('throws OpenAiError on invalid JSON output', async () => {
  const client = clientReturning(responsesPayload('not json'));
  await assert.rejects(
    client.structured({ instructions: '', input: '', schemaName: 's', schema: SCHEMA }),
    OpenAiError
  );
});

test('throws OpenAiError when response has no text', async () => {
  const client = clientReturning({ output: [] });
  await assert.rejects(
    client.structured({ instructions: '', input: '', schemaName: 's', schema: SCHEMA }),
    /no output text/
  );
});
