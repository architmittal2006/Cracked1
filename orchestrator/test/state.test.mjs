import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, resumableState, taskHash, loadState, saveState } from '../src/state.mjs';
import { loadConfig, ConfigError, validateTaskInput } from '../src/config.mjs';
import { buildReportMarkdown } from '../src/report.mjs';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ENV = {
  OPENAI_API_KEY: 'k',
  DEVIN_API_KEY: 'k',
  DEVIN_ORG_ID: 'org-x',
  TASK_DESCRIPTION: 'task',
  TASK_ACCEPTANCE_CRITERIA: 'criteria',
};

test('loadConfig requires credentials and task input', () => {
  assert.throws(() => loadConfig({}), ConfigError);
  const config = loadConfig(ENV);
  assert.equal(config.openai.baseUrl, 'https://api.openai.com/v1');
  assert.equal(config.devin.baseUrl, 'https://api.devin.ai');
  assert.equal(config.limits.maxCorrectionCycles, 2);
  assert.doesNotThrow(() => validateTaskInput(config));
  assert.throws(() => validateTaskInput(loadConfig({ ...ENV, TASK_DESCRIPTION: '' })), ConfigError);
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
