// Central configuration. Everything is env-driven so the GitHub Actions
// workflow and local mock runs share the same code path.

export class ConfigError extends Error {}

function intEnv(env, name, fallback) {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 0) {
    throw new ConfigError(`${name} must be a non-negative integer, got: ${JSON.stringify(raw)}`);
  }
  return value;
}

export function loadConfig(env = process.env) {
  // LLM provider: 'groq' (default, free tier) or 'openai' (paid).
  // No silent fallback — the selected provider's key is required and used
  // exclusively; a failing provider never switches to the other.
  const provider = (env.LLM_PROVIDER || 'groq').toLowerCase();
  if (!['groq', 'openai'].includes(provider)) {
    throw new ConfigError(`LLM_PROVIDER must be 'groq' or 'openai', got: ${JSON.stringify(provider)}`);
  }

  const required = ['DEVIN_API_KEY', 'DEVIN_ORG_ID'];
  if (provider === 'groq') required.push('GROQ_API_KEY');
  if (provider === 'openai') required.push('OPENAI_API_KEY');
  const missing = required.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new ConfigError(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const maxCorrectionCycles = intEnv(env, 'ORCHESTRATOR_MAX_CORRECTION_CYCLES', 2);
  if (maxCorrectionCycles > 2) {
    // Hard product limit: never run more than two GPT->Devin correction cycles.
    throw new ConfigError('ORCHESTRATOR_MAX_CORRECTION_CYCLES cannot exceed 2');
  }

  return {
    llm: {
      provider,
      apiKey: provider === 'groq' ? env.GROQ_API_KEY : env.OPENAI_API_KEY,
      baseUrl: provider === 'groq'
        ? (env.GROQ_API_BASE || 'https://api.groq.com/openai/v1')
        : (env.OPENAI_API_BASE || 'https://api.openai.com/v1'),
      model: provider === 'groq'
        ? (env.GROQ_MODEL || 'openai/gpt-oss-120b')
        : (env.OPENAI_MODEL || 'gpt-5-mini'),
      // Groq's Responses API does not document a `store` field; omit it there.
      sendStoreFlag: provider === 'openai',
    },
    devin: {
      apiKey: env.DEVIN_API_KEY,
      orgId: env.DEVIN_ORG_ID,
      baseUrl: env.DEVIN_API_BASE || 'https://api.devin.ai',
      mode: env.DEVIN_MODE || 'normal',
      maxAcuLimit: intEnv(env, 'DEVIN_MAX_ACU_LIMIT', 10),
    },
    task: {
      description: env.TASK_DESCRIPTION || '',
      acceptanceCriteria: env.TASK_ACCEPTANCE_CRITERIA || '',
      repository: env.TASK_REPOSITORY || 'architmittal2006/Cracked1',
      baseBranch: env.TASK_BASE_BRANCH || 'feature/phase-2-admin-cms',
    },
    limits: {
      maxCorrectionCycles,
      maxOpenAiCalls: intEnv(env, 'ORCHESTRATOR_MAX_OPENAI_CALLS', 12),
      maxDevinCalls: intEnv(env, 'ORCHESTRATOR_MAX_DEVIN_CALLS', 200),
      maxPollMinutes: intEnv(env, 'ORCHESTRATOR_MAX_POLL_MINUTES', 90),
      pollIntervalSeconds: intEnv(env, 'ORCHESTRATOR_POLL_INTERVAL_SECONDS', 60),
      httpTimeoutMs: intEnv(env, 'ORCHESTRATOR_HTTP_TIMEOUT_MS', 60000),
      httpMaxRetries: intEnv(env, 'ORCHESTRATOR_HTTP_MAX_RETRIES', 4),
    },
    statePath: env.ORCHESTRATOR_STATE_PATH || 'orchestrator-state.json',
    reportDir: env.ORCHESTRATOR_REPORT_DIR || '.',
  };
}

export function validateTaskInput(config) {
  if (!config.task.description.trim()) {
    throw new ConfigError('TASK_DESCRIPTION is required');
  }
  if (!config.task.acceptanceCriteria.trim()) {
    throw new ConfigError('TASK_ACCEPTANCE_CRITERIA is required');
  }
}
