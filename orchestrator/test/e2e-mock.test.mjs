// End-to-end CLI test against a local mock HTTP server. No real API credits
// are consumed: OPENAI_API_BASE and DEVIN_API_BASE point at 127.0.0.1.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'cli.mjs');

const BRIEF = {
  title: 'Mock brief',
  summary: 'mock',
  planSteps: ['step'],
  filesToTouch: ['x.ts'],
  acceptanceMapping: ['a'],
  risks: [],
  devinPrompt: 'implement mock',
};

function responsesBody(text) {
  return {
    output: [{ type: 'message', content: [{ type: 'output_text', text }] }],
  };
}

/**
 * Scripted mock server.
 * @param {object} opts
 * @param {Array<object>} opts.verdicts  review verdicts returned in order
 */
function startMockServer(verdicts) {
  const calls = { responses: 0, sessions: 0, gets: 0, messages: 0 };
  let getCount = 0;
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const send = (status, obj) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(obj));
      };
      const url = new URL(req.url, 'http://x');

      if (req.method === 'POST' && url.pathname === '/v1/responses') {
        calls.responses += 1;
        const isBrief = calls.responses === 1;
        const payload = isBrief ? BRIEF : verdicts[Math.min(calls.responses - 2, verdicts.length - 1)];
        return send(200, responsesBody(JSON.stringify(payload)));
      }
      if (req.method === 'POST' && url.pathname === '/v3/organizations/org-x/sessions') {
        calls.sessions += 1;
        return send(200, { session_id: 'devin-mock-1', url: 'https://app.devin.ai/sessions/devin-mock-1', status: 'new' });
      }
      const sessionMatch = url.pathname.match(/^\/v3\/organizations\/org-x\/sessions\/([^/]+)(\/messages)?$/);
      if (sessionMatch) {
        if (req.method === 'GET') {
          calls.gets += 1;
          getCount += 1;
          // Stay 'running' for two polls, then finish.
          if (getCount <= 2) {
            return send(200, { session_id: sessionMatch[1], status: 'running', status_detail: 'working' });
          }
          return send(200, {
            session_id: sessionMatch[1],
            status: 'exit',
            status_detail: 'finished',
            pull_requests: [{ url: 'https://github.com/x/pull/9' }],
            acus_consumed: 1.25,
            structured_output: {
              summary: 'implemented',
              filesChanged: ['backend/server.ts'],
              testsRun: ['npm run test:unit'],
              testResults: '40 passed',
              pullRequestUrl: 'https://github.com/x/pull/9',
              outstandingIssues: [],
            },
          });
        }
        if (req.method === 'POST' && sessionMatch[2] === '/messages') {
          calls.messages += 1;
          return send(200, { session_id: sessionMatch[1], status: 'running' });
        }
      }
      send(404, { error: `unmocked ${req.method} ${url.pathname}` });
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port, calls }));
  });
}

function runCli(env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [CLI], {
      env: { ...process.env, ...env },
      cwd: path.join(HERE, '..', '..'), // repo root of the worktree
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('e2e: approve on first review completes and writes reports', async () => {
  const { server, port, calls } = await startMockServer([
    { verdict: 'approve', issues: [], correctiveInstructions: '', summary: 'looks good' },
  ]);
  const dir = await mkdtemp(path.join(tmpdir(), 'orch-e2e-'));
  try {
    const { code, stdout, stderr } = await runCli({
      OPENAI_API_KEY: 'sk-mock',
      OPENAI_API_BASE: `http://127.0.0.1:${port}/v1`,
      OPENAI_MODEL: 'mock-model',
      DEVIN_API_KEY: 'cog-mock',
      DEVIN_API_BASE: `http://127.0.0.1:${port}`,
      DEVIN_ORG_ID: 'org-x',
      TASK_DESCRIPTION: 'Add health endpoint',
      TASK_ACCEPTANCE_CRITERIA: 'GET /api/health returns 200',
      ORCHESTRATOR_STATE_PATH: path.join(dir, 'state.json'),
      ORCHESTRATOR_REPORT_DIR: path.join(dir, 'reports'),
      ORCHESTRATOR_POLL_INTERVAL_SECONDS: '0',
      ORCHESTRATOR_MAX_POLL_MINUTES: '5',
    });
    assert.equal(code, 0, `cli failed: ${stderr}\n${stdout}`);
    assert.equal(calls.sessions, 1);
    assert.equal(calls.messages, 0);
    assert.equal(calls.responses, 2); // brief + one review

    const state = JSON.parse(await readFile(path.join(dir, 'state.json'), 'utf8'));
    assert.equal(state.status, 'completed');
    assert.equal(state.devinSessionId, 'devin-mock-1');
    assert.equal(state.correctionCycles, 0);

    const reports = await readdir(path.join(dir, 'reports'));
    assert.ok(reports.some((f) => f.endsWith('.md')));
    assert.ok(reports.some((f) => f.endsWith('.json')));
    const md = await readFile(path.join(dir, 'reports', reports.find((f) => f.endsWith('.md'))), 'utf8');
    assert.match(md, /devin-mock-1/);
    assert.match(md, /approve/);
  } finally {
    server.close();
  }
});

test('e2e: changes_required triggers exactly one corrective message then approve', async () => {
  const { server, port, calls } = await startMockServer([
    { verdict: 'changes_required', issues: ['missing test'], correctiveInstructions: 'add a test', summary: 'incomplete' },
    { verdict: 'approve', issues: [], correctiveInstructions: '', summary: 'now complete' },
  ]);
  const dir = await mkdtemp(path.join(tmpdir(), 'orch-e2e-'));
  try {
    const { code, stderr, stdout } = await runCli({
      OPENAI_API_KEY: 'sk-mock',
      OPENAI_API_BASE: `http://127.0.0.1:${port}/v1`,
      DEVIN_API_KEY: 'cog-mock',
      DEVIN_API_BASE: `http://127.0.0.1:${port}`,
      DEVIN_ORG_ID: 'org-x',
      TASK_DESCRIPTION: 'Add health endpoint',
      TASK_ACCEPTANCE_CRITERIA: 'GET /api/health returns 200',
      ORCHESTRATOR_STATE_PATH: path.join(dir, 'state.json'),
      ORCHESTRATOR_REPORT_DIR: path.join(dir, 'reports'),
      ORCHESTRATOR_POLL_INTERVAL_SECONDS: '0',
      ORCHESTRATOR_MAX_POLL_MINUTES: '5',
    });
    assert.equal(code, 0, `cli failed: ${stderr}\n${stdout}`);
    assert.equal(calls.sessions, 1); // still exactly one session
    assert.equal(calls.messages, 1); // one correction sent to same session
    assert.equal(calls.responses, 3); // brief + 2 reviews

    const state = JSON.parse(await readFile(path.join(dir, 'state.json'), 'utf8'));
    assert.equal(state.status, 'completed');
    assert.equal(state.correctionCycles, 1);
    assert.equal(state.reviews.length, 2);
  } finally {
    server.close();
  }
});

test('e2e: missing credentials fails fast with clear error', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'orch-e2e-'));
  const { code, stderr } = await runCli({
    OPENAI_API_KEY: '',
    DEVIN_API_KEY: '',
    DEVIN_ORG_ID: '',
    TASK_DESCRIPTION: 'x',
    TASK_ACCEPTANCE_CRITERIA: 'y',
    ORCHESTRATOR_STATE_PATH: path.join(dir, 'state.json'),
    ORCHESTRATOR_REPORT_DIR: path.join(dir, 'reports'),
  });
  assert.equal(code, 1);
  assert.match(stderr, /configuration error|Missing required/);
});
