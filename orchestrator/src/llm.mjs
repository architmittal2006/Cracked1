// LLM provider factory. Both providers use an OpenAI-compatible Responses API:
//   - OpenAI: https://api.openai.com/v1/responses           (paid)
//   - Groq:   https://api.groq.com/openai/v1/responses      (free tier)
// Docs: https://console.groq.com/docs/responses-api
//       https://developers.openai.com/api/docs/guides/structured-outputs
//
// The provider is selected once via LLM_PROVIDER (default 'groq'). There is
// intentionally NO fallback: if the selected provider fails, the run fails.

import { createOpenAiClient } from './openai.mjs';

export class LlmBudgetError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LlmBudgetError';
  }
}

// Rough token estimate (~3.5 chars/token for English+markdown). Used only as a
// pre-flight guard so oversized prompts fail fast with a clear message instead
// of a provider HTTP 413/429.
//
// LIMITATIONS — read before tuning:
//  - chars/3.5 is an approximation; code, JSON and non-English text tokenize
//    denser (often 2-3 chars/token), so the estimate can UNDERCOUNT real usage.
//  - It covers `instructions` + `input` only. It does NOT account for the JSON
//    schema overhead, provider-side templating, or OUTPUT tokens.
//  - Groq's TPM is org-level and appears to count generated tokens as well;
//    unused input headroom is NOT guaranteed to be available for output. The
//    conservative default below leaves margin for both.
export function estimateTokens(text) {
  return Math.ceil(String(text ?? '').length / 3.5);
}

export function maxInputTokens(env = process.env) {
  const raw = env.ORCHESTRATOR_MAX_INPUT_TOKENS;
  if (raw === undefined || raw === '') return 5000; // conservative vs Groq 8K TPM
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : 5000;
}

export function createLlmClient(config, http, env = process.env) {
  const { llm } = config;
  const client = createOpenAiClient({
    apiKey: llm.apiKey,
    baseUrl: llm.baseUrl,
    model: llm.model,
    sendStoreFlag: llm.sendStoreFlag,
    timeoutMs: http.timeoutMs,
    maxRetries: http.maxRetries,
    fetchImpl: http.fetchImpl,
    sleep: http.sleep,
  });
  const budget = maxInputTokens(env);
  return {
    async structured(args) {
      const estimated = estimateTokens(args.instructions) + estimateTokens(args.input);
      if (estimated > budget) {
        throw new LlmBudgetError(
          `Estimated input ~${estimated} tokens exceeds ORCHESTRATOR_MAX_INPUT_TOKENS=${budget}. ` +
          'Reduce ORCHESTRATOR_MAX_CONTEXT_CHARS or raise the provider TPM limit.'
        );
      }
      return client.structured(args);
    },
  };
}
