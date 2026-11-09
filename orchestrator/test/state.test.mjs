import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, resumableState, taskHash, loadState, saveState } from '../src/state.mjs';
import { loadConfig, ConfigError, validateTaskInput } from '../src/config.mjs';
import { buildReportMarkdown } from '../src/report.mjs';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ENV = {
  GROQ_API_KEY: 'gsk-test',
  DEVIN_API_KEY: 'k',
  DEVIN_ORG_ID: 'org-x',
  TASK_DESCRIPTION: 'task',
  TASK_ACCEPTANCE_CRITERIA: 'criteria',
};

test('loadConfig requires credentials and task input', () => {
  assert.throws(() => loadConfig({}), ConfigError);
  const config = loadConfig(ENV);
  assert.equal(config.llm.provider, 'groq');
  assert.equal(config.llm.baseUrl, 'https://api.groq.com/openai/v1');
  assert.equal(config.llm.model, 'openai/gpt-oss-120b');
  assert.equal(config.llm.sendStoreFlag, false);
  assert.equal(config.devin.baseUrl, 'https://api.devin.ai');
  assert.equal(config.limits.maxCorrectionCycles, 2);
  assert.doesNotThrow(() => validateTaskInput(config));
  assert.throws(() => validateTaskInput(loadConfig({ ...ENV, TASK_DESCRIPTION: '' })), ConfigError);
});

test('provider selection: groq default, openai opt-in, invalid rejected', () => {
  const groq = loadConfig(ENV);
  assert.equal(groq.llm.provider, 'groq');
  assert.equal(groq.llm.sendStoreFlag, false);

  const openai = loadConfig({
    ...ENV, LLM_PROVIDER: 'openai', OPENAI_API_KEY: 'sk-test', GROQ_API_KEY: '',
  });
  assert.equal(openai.llm.provider, 'openai');
  assert.equal(openai.llm.apiKey, 'sk-test');
  assert.equal(openai.llm.baseUrl, 'https://api.openai.com/v1');
  assert.equal(openai.llm.sendStoreFlag, true);

  assert.throws(() => loadConfig({ ...ENV, LLM_PROVIDER: 'bogus' }), ConfigError);
});

test('only the selected provider key is required; no silent fallback', () => {
  // Groq selected, no OpenAI key at all — must still load.
  const groq = loadConfig({ ...ENV, OPENAI_API_KEY: undefined });
  assert.equal(groq.llm.provider, 'groq');
  // OpenAI selected without OPENAI_API_KEY — must fail even if GROQ key exists.
  assert.throws(
    () => loadConfig({ ...ENV, LLM_PROVIDER: 'openai', OPENAI_API_KEY: '' }),
    /OPENAI_API_KEY/
  );
  // Groq selected without GROQ_API_KEY — must fail even if OPENAI key exists.
  assert.throws(
    () => loadConfig({ ...ENV, GROQ_API_KEY: '', OPENAI_API_KEY: 'sk-x' }),
    /GROQ_API_KEY/
  );
});

test('loadConfig rejects correction cycles above 2', () => {
  assert.throws(() => loadConfig({ ...ENV, ORCHESTRATOR_MAX_CORRECTION_CYCLES: '3' }), ConfigError);
});

test('resumableState only resumes same-task active states', () => {
  const config = loadConfig(ENV);
  const state = initialState({ runId: 'r', config });
  state.status = 'implementing';
  assert.equal(resumableState(state, config), state);
  state.status = 'completed';
  assert.equal(resumableState(state, config), null);
  state.status = 'implementing';
  const other = loadConfig({ ...ENV, TASK_DESCRIPTION: 'other' });
  assert.equal(resumableState(state, other), null);
});

test('failed state with a session resumes; without a session does not', () => {
  const config = loadConfig(ENV);
  const state = initialState({ runId: 'r', config });
  state.status = 'failed';
  assert.equal(resumableState(state, config), null);
  state.devinSessionId = 'devin-9';
  assert.equal(resumableState(state, config), state);
});

test('saveState/loadState round-trips JSON', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'orch-'));
  const file = path.join(dir, 'state.json');
  const config = loadConfig(ENV);
  const state = initialState({ runId: 'r', config });
  await saveState(file, state);
  const loaded = await loadState(file);
  assert.equal(loaded.runId, 'r');
  assert.equal(loaded.taskHash, taskHash('task', 'criteria'));
  assert.equal(await loadState(path.join(dir, 'missing.json')), null);
});

test('report markdown contains session links, reviews and safety notes', () => {
  const config = loadConfig(ENV);
  const state = initialState({ runId: 'r', config });
  state.status = 'completed';
  state.brief = { title: 'T', summary: 'S', planSteps: ['a'], filesToTouch: ['f.ts'], acceptanceMapping: [], risks: [] };
  state.devinSessionUrl = 'https://app.devin.ai/sessions/devin-1';
  state.devinResults = [{
    sessionId: 'devin-1', status: 'exit', statusDetail: 'finished',
    pullRequests: [], acusConsumed: 2, onDemandUsageUsd: 0,
    structuredOutput: { summary: 'done', filesChanged: ['a.ts'], testsRun: ['npm test'], testResults: 'pass', pullRequestUrl: 'https://github.com/x/pull/1', outstandingIssues: [] },
    url: 'https://app.devin.ai/sessions/devin-1',
  }];
  state.reviews = [{ at: 't', cycle: 0, verdict: { verdict: 'approve', summary: 'lgtm', issues: [], correctiveInstructions: '' } }];
  const md = buildReportMarkdown({ state, config, startedAt: 's', finishedAt: 'f' });
  assert.match(md, /devin-1/);
  assert.match(md, /approve/);
  assert.match(md, /never merges PRs|No merge or deployment/);
});

test('project context respects ORCHESTRATOR_MAX_CONTEXT_CHARS budget', async () => {
  const { mkdtemp, mkdir, writeFile } = await import('node:fs/promises');
  const { loadProjectContext, maxContextChars } = await import('../src/prompts.mjs');
  const dir = await mkdtemp(path.join(tmpdir(), 'ctx-'));
  await mkdir(path.join(dir, 'docs'), { recursive: true });
  await writeFile(path.join(dir, 'docs', 'BIG.md'), 'x'.repeat(50000));
  const small = await loadProjectContext(dir, { ORCHESTRATOR_MAX_CONTEXT_CHARS: '2000' });
  assert.ok(small.length <= 2100);
  const def = maxContextChars({});
  assert.equal(def, 12000);
});

test('essential docs are retained ahead of lower-priority files under budget pressure', async () => {
  const { mkdtemp, mkdir, writeFile } = await import('node:fs/promises');
  const { loadProjectContext } = await import('../src/prompts.mjs');
  const dir = await mkdtemp(path.join(tmpdir(), 'ctx-pri-'));
  await mkdir(path.join(dir, 'docs'), { recursive: true });
  // Huge low-priority doc first in old order; essentials must still appear.
  await writeFile(path.join(dir, 'README.md'), 'r'.repeat(50000));
  await writeFile(path.join(dir, 'docs', 'AGENTS.md'), 'agents rules');
  await writeFile(path.join(dir, 'docs', 'SYSTEM_ARCHITECTURE.md'), 'arch');
  await writeFile(path.join(dir, 'docs', 'IMPLEMENTATION_ROADMAP.md'), 'roadmap');
  await writeFile(path.join(dir, 'docs', 'OPEN_DECISIONS.md'), 'decisions');
  const ctx = await loadProjectContext(dir, { ORCHESTRATOR_MAX_CONTEXT_CHARS: '500' });
  assert.match(ctx, /docs\/AGENTS\.md/);
  assert.match(ctx, /docs\/SYSTEM_ARCHITECTURE\.md/);
  assert.match(ctx, /docs\/IMPLEMENTATION_ROADMAP\.md/);
  assert.match(ctx, /docs\/OPEN_DECISIONS\.md/);
});

test('oversized doc is skipped, not breaking the loop', async () => {
  const { mkdtemp, mkdir, writeFile } = await import('node:fs/promises');
  const { loadProjectContext } = await import('../src/prompts.mjs');
  const dir = await mkdtemp(path.join(tmpdir(), 'ctx-skip-'));
  await mkdir(path.join(dir, 'docs'), { recursive: true });
  await writeFile(path.join(dir, 'docs', 'AGENTS.md'), 'x'.repeat(50000)); // too big
  await writeFile(path.join(dir, 'docs', 'PRODUCT.md'), 'product doc');     // fits after
  const ctx = await loadProjectContext(dir, { ORCHESTRATOR_MAX_CONTEXT_CHARS: '2000' });
  assert.doesNotMatch(ctx, /AGENTS\.md/);
  assert.match(ctx, /docs\/PRODUCT\.md/);
});
