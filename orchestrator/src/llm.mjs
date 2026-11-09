// LLM provider factory. Both providers use an OpenAI-compatible Responses API:
//   - OpenAI: https://api.openai.com/v1/responses           (paid)
//   - Groq:   https://api.groq.com/openai/v1/responses      (free tier)
// Docs: https://console.groq.com/docs/responses-api
//       https://developers.openai.com/api/docs/guides/structured-outputs
//
// The provider is selected once via LLM_PROVIDER (default 'groq'). There is
// intentionally NO fallback: if the selected provider fails, the run fails.

import { createOpenAiClient } from './openai.mjs';

export function createLlmClient(config, http) {
  const { llm } = config;
  return createOpenAiClient({
    apiKey: llm.apiKey,
    baseUrl: llm.baseUrl,
    model: llm.model,
    sendStoreFlag: llm.sendStoreFlag,
    timeoutMs: http.timeoutMs,
    maxRetries: http.maxRetries,
    fetchImpl: http.fetchImpl,
    sleep: http.sleep,
  });
}
