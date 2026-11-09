// OpenAI Responses API client.
// Endpoint: POST {baseUrl}/responses  (baseUrl default https://api.openai.com/v1)
// Docs: https://developers.openai.com/api/docs/api-reference/responses
// Auth: Authorization: Bearer <OPENAI_API_KEY>
// Structured outputs: text.format = { type: 'json_schema', name, schema, strict: true }

import { requestJson } from './http.mjs';

export class OpenAiError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'OpenAiError';
    this.cause = cause;
  }
}

function extractOutputText(response) {
  if (typeof response?.output_text === 'string' && response.output_text.length > 0) {
    return response.output_text;
  }
  for (const item of response?.output ?? []) {
    if (item?.type !== 'message') continue;
    for (const part of item.content ?? []) {
      if (part?.type === 'output_text' && typeof part.text === 'string') {
        return part.text;
      }
    }
  }
  return null;
}

export function createOpenAiClient({ apiKey, baseUrl, model, sendStoreFlag = true, maxOutputTokens = 1500, timeoutMs, maxRetries, fetchImpl, sleep, onCall }) {
  return {
    /**
     * Run a single Responses API call with a strict JSON-schema output.
     * @returns {Promise<object>} parsed structured output
     */
    async structured({ instructions, input, schemaName, schema }) {
      onCall?.();
      const { json } = await requestJson({
        url: `${baseUrl}/responses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: {
          model,
          instructions,
          input,
          ...(sendStoreFlag ? { store: false } : {}),
          max_output_tokens: maxOutputTokens,
          text: {
            format: {
              type: 'json_schema',
              name: schemaName,
              strict: true,
              schema,
            },
          },
        },
        timeoutMs,
        maxRetries,
        fetchImpl,
        sleep,
      });

      const text = extractOutputText(json);
      if (text === null) {
        throw new OpenAiError('OpenAI response contained no output text');
      }
      try {
        return JSON.parse(text);
      } catch (error) {
        throw new OpenAiError(
          `OpenAI returned invalid JSON for schema "${schemaName}": ${error instanceof Error ? error.message : String(error)}`,
          error
        );
      }
    },
  };
}
