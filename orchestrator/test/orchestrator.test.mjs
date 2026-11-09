import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runOrchestrator, OrchestratorError } from '../src/orchestrator.mjs';
import { initialState, taskHash } from '../src/state.mjs';
import { loadConfig } from '../src/config.mjs';

const ENV = {
  OPENAI_API_KEY: 'sk-test',
  DEVIN_API_KEY: 'cog-test',
  DEVIN_ORG_ID: 'org-test',
  TASK_DESCRIPTION: 'Add a health check endpoint',
  TASK_ACCEPTANCE_CRITERIA: 'GET /api/health returns 200',
};

function makeConfig(overrides = {}) {
  const config = loadConfig({ ...ENV, ...overrides });
  config.limits.maxPollMinutes = Number(overrides.ORCHESTRATOR_MAX_POLL_MINUTES ?? 5);
  config.limits.pollIntervalSeconds = 1;
  return config;
}

const BRIEF = {
  title: 'Add health endpoint',
  summary: 'Add GET /api/health',
  planSteps: ['add route', 'add test'],
  filesToTouch: ['backend/server.ts'],
  acceptanceMapping: ['criterion 1 -> route'],
  risks: ['none'],
  devinPrompt: 'Implement the health endpoint.',
};

function devinResult(i) {
  return {
    sessionId: 'devin-1',
    status: 'exit',
    statusDetail: 'finished',
    pullRequests: [{ url: 'https://github.com/x/pull/1' }],
    acusConsumed: 1.5,
    onDemandUsageUsd: 0,
    structuredOutput: {
      summary: `round ${i} done`,
      filesChanged: ['backend/server.ts'],
      testsRun: ['npm run test:unit'],
      testResults: 'pass',
      pullRequestUrl: 'https://github.com/x/pull/1',
      outstandingIssues: [],
    },
    url: 'https://app.devin.ai/sessions/devin-1',
  };
}

function sessionFinished() {
  return { session_id: 'devin-1', status: 'exit', status_detail: 'finished', pull_requests: [], structured_output: null };
}

function makeDeps({ openaiScript = [], devinScript = {}, config = makeConfig(), state = null } = {}) {
  const persisted = [];
  const calls = { createSession: 0, sendMessage: 0, getSession: 0, openai: 0 };
  const openaiQueue = [...openaiScript];
  const devinStatuses = devinScript.statuses ?? [sessionFinished()];
  let statusIndex = 0;
  const openai = {
    structured: async ({ schemaName }) => {
      calls.openai += 1;
      if (schemaName === 'implementation_brief') return BRIEF;
      const next = openaiQueue.length ? openaiQueue.shift() : undefined;
      return next ?? { verdict: 'approve', issues: [], correctiveInstructions: '', summary: 'ok' };
    },
  };
  const devin = {
    createSession: async () => {
      calls.createSession += 1;
      return { session_id: 'devin-1', url: 'https://app.devin.ai/sessions/devin-1', status: 'new' };
    },
    getSession: async () => {
      calls.getSession += 1;
      const s = devinStatuses[Math.min(statusIndex, devinStatuses.length - 1)];
      statusIndex += 1;
      return s;
    },
    sendMessage: async () => {
      calls.sendMessage += 1;
      return { session_id: 'devin-1', status: 'running' };
    },
  };
  const s = state ?? initialState({ runId: 'test-run', config });
  return {
    deps: {
      config,
      state: s,
      openai,
      devin,
      persist: async (st) => { persisted.push({ ...st }); },
      sleep: async () => {},
      now: (() => { let t = 0; return () => (t += 1000); })(),
      projectContext: 'context',
      log: () => {},
    },
    calls,
    persisted,
    state: s,
  };
}

test('happy path: brief -> implement -> approve, one session, no corrections', async () => {
  const { deps, calls, state } = makeDeps();
  const result = await runOrchestrator(deps);
  assert.equal(result.status, 'completed');
  assert.equal(calls.createSession, 1);
  assert.equal(calls.sendMessage, 0);
  assert.equal(state.correctionCycles, 0);
  assert.equal(state.devinSessionId, 'devin-1');
  assert.equal(state.reviews.length, 1);
  assert.equal(state.reviews[0].verdict.verdict, 'approve');
  assert.equal(state.apiCalls.openai, 2); // brief + review
});

test('one correction cycle then approve', async () => {
  const openaiScript = [
    { verdict: 'changes_required', issues: ['bug X'], correctiveInstructions: 'fix X', summary: 'needs fix' },
    { verdict: 'approve', issues: [], correctiveInstructions: '', summary: 'fixed' },
  ];
  const { deps, calls, state } = makeDeps({ openaiScript });
  const result = await runOrchestrator(deps);
  assert.equal(result.status, 'completed');
  assert.equal(calls.sendMessage, 1);
  assert.equal(state.correctionCycles, 1);
  assert.equal(state.devinResults.length, 2);
  assert.equal(state.reviews.length, 2);
});

test('stops after two correction cycles with completed_with_issues', async () => {
  const reject = { verdict: 'changes_required', issues: ['still broken'], correctiveInstructions: 'fix again', summary: 'no' };
  const openaiScript = [reject, reject, reject];
  const { deps, calls, state } = makeDeps({ openaiScript });
  const result = await runOrchestrator(deps);
  assert.equal(result.status, 'completed_with_issues');
  assert.equal(calls.sendMessage, 2); // hard cap of two corrections
  assert.equal(state.correctionCycles, 2);
  assert.match(state.failure, /after 2 correction cycles/);
});

test('devin session error fails the run and persists state', async () => {
  const { deps, state, persisted } = makeDeps({
    devinScript: { statuses: [{ session_id: 'devin-1', status: 'error', status_detail: 'error' }] },
  });
  await assert.rejects(runOrchestrator(deps), OrchestratorError);
  const last = persisted[persisted.length - 1];
  assert.equal(last.phase, 'implementing');
});

test('resume: existing devinSessionId never creates a duplicate session', async () => {
  const config = makeConfig();
  const state = initialState({ runId: 'resume-run', config });
  state.brief = BRIEF;
  state.devinSessionId = 'devin-existing';
  state.status = 'implementing';
  const { deps, calls } = makeDeps({ config, state });
  const result = await runOrchestrator(deps);
  assert.equal(result.status, 'completed');
  assert.equal(calls.createSession, 0);
  assert.ok(calls.getSession >= 1);
});

test('resume: recorded devin result skips straight to review', async () => {
  const config = makeConfig();
  const state = initialState({ runId: 'resume-run-2', config });
  state.brief = BRIEF;
  state.devinSessionId = 'devin-existing';
  state.devinResults = [devinResult(1)];
  state.status = 'reviewing';
  const { deps, calls } = makeDeps({ config, state });
  const result = await runOrchestrator(deps);
  assert.equal(result.status, 'completed');
  assert.equal(calls.createSession, 0);
  assert.equal(calls.getSession, 0);
});

test('openai budget exhaustion stops the run', async () => {
  const config = makeConfig({ ORCHESTRATOR_MAX_OPENAI_CALLS: '1' });
  const { deps } = makeDeps({ config });
  await assert.rejects(runOrchestrator(deps), /API call budget exhausted for openai/);
});

test('poll timeout when session never finishes', async () => {
  const running = { session_id: 'devin-1', status: 'running', status_detail: 'working' };
  const config = makeConfig({ ORCHESTRATOR_MAX_POLL_MINUTES: '0' });
  // maxPollMinutes=0 -> deadline already passed on first check after first poll
  const { deps } = makeDeps({ config, devinScript: { statuses: [running] } });
  await assert.rejects(runOrchestrator(deps), /Timed out/);
});

test('evidence collector output reaches the reviewer input', async () => {
  const config = makeConfig();
  const { deps, state } = makeDeps({ config });
  const seenInputs = [];
  deps.openai = {
    structured: async ({ schemaName, input }) => {
      if (schemaName === 'review_verdict') seenInputs.push(input);
      return schemaName === 'implementation_brief'
        ? BRIEF
        : { verdict: 'approve', issues: [], correctiveInstructions: '', summary: 'ok' };
    },
  };
  deps.collectEvidence = async () => ({
    evidence: [{
      url: 'https://github.com/o/r/pull/1', title: 'PR', state: 'open',
      additions: 5, deletions: 0, changedFiles: 1, files: ['a.ts'],
      patch: '@@ +app.get("/api/health")', patchTruncated: false,
    }],
    errors: [],
  });
  await runOrchestrator(deps);
  assert.equal(seenInputs.length, 1);
  assert.match(seenInputs[0], /AUTHORITATIVE/);
  assert.match(seenInputs[0], /api\/health/);
  assert.match(seenInputs[0], /UNVERIFIED/);
});

test('state taskHash guards against cross-task resume', () => {
  const config = makeConfig();
  const state = initialState({ runId: 'x', config });
  state.status = 'implementing';
  const other = makeConfig({ TASK_DESCRIPTION: 'Different task' });
  // resumableState is exercised in state tests; here verify hash differs
  assert.notEqual(state.taskHash, taskHash(other.task.description, other.task.acceptanceCriteria));
});
