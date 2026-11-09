#!/usr/bin/env node
// CLI entry point. Reads configuration from environment variables (set by the
// GitHub Actions workflow or locally for mock runs), executes the
// orchestrator, persists state, and writes the final report.
//
// Usage:
//   node src/cli.mjs                 # real run (requires API keys)
//   node src/cli.mjs --mock-test     # not implemented; use `npm test` for mocks

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadConfig, validateTaskInput, ConfigError } from './config.mjs';
import { loadState, saveState, initialState, resumableState } from './state.mjs';
import { loadProjectContext } from './prompts.mjs';
import { createOpenAiClient } from './openai.mjs';
import { createDevinClient } from './devin.mjs';
import { collectPullRequestEvidence, parsePullRequestUrl } from './github.mjs';
import { runOrchestrator, OrchestratorError } from './orchestrator.mjs';
import { buildReportMarkdown, buildReportJson } from './report.mjs';

const startedAt = new Date().toISOString();

function argValue(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const config = loadConfig(process.env);
  // CLI flags override env for local/mock runs.
  if (argValue('--task')) config.task.description = argValue('--task');
  if (argValue('--criteria')) config.task.acceptanceCriteria = argValue('--criteria');
  if (argValue('--state-path')) config.statePath = argValue('--state-path');
  if (argValue('--report-dir')) config.reportDir = argValue('--report-dir');
  if (argValue('--repo-root')) config.repoRoot = argValue('--repo-root');
  validateTaskInput(config);

  const repoRoot = config.repoRoot ?? process.cwd();
  const statePath = path.resolve(repoRoot, config.statePath);
  const runId = process.env.GITHUB_RUN_ID
    ? `run-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT ?? '1'}`
    : `local-${Date.now()}`;

  let state = resumableState(await loadState(statePath), config)
    ?? initialState({ runId, config });
  state.runId = state.runId ?? runId;

  const persist = async (s) => saveState(statePath, s);
  const log = (msg) => console.log(`[orchestrator] ${msg}`);

  const projectContext = await loadProjectContext(repoRoot);
  log(`Loaded ${projectContext.length} chars of project context`);

  const openai = createOpenAiClient({
    apiKey: config.openai.apiKey,
    baseUrl: config.openai.baseUrl,
    model: config.openai.model,
    timeoutMs: config.limits.httpTimeoutMs,
    maxRetries: config.limits.httpMaxRetries,
  });
  const devin = createDevinClient({
    apiKey: config.devin.apiKey,
    orgId: config.devin.orgId,
    baseUrl: config.devin.baseUrl,
    timeoutMs: config.limits.httpTimeoutMs,
    maxRetries: config.limits.httpMaxRetries,
  });

  // API-call budgets are enforced inside runOrchestrator via state.apiCalls.

  // Reviewer evidence: fetch actual PR diffs via GITHUB_TOKEN when running in
  // Actions. Locally (no token) the reviewer is told the evidence is missing.
  const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const collectEvidence = githubToken
    ? async (result) => {
        const urls = (result.pullRequests ?? [])
          .map((p) => (typeof p === 'string' ? p : p?.url))
          .filter((u) => u && parsePullRequestUrl(u));
        if (!urls.length) return { evidence: [], errors: [] };
        return collectPullRequestEvidence({
          token: githubToken,
          pullRequestUrls: urls,
          timeoutMs: config.limits.httpTimeoutMs,
          maxRetries: config.limits.httpMaxRetries,
        });
      }
    : null;

  let outcome;
  try {
    outcome = await runOrchestrator({
      config,
      state,
      openai,
      devin,
      collectEvidence,
      persist,
      projectContext,
      log,
    });
  } catch (error) {
    state.status = 'failed';
    state.failure = error instanceof Error ? error.message : String(error);
    await persist(state);
    await writeReports({ config, state, startedAt });
    throw error;
  }

  await writeReports({ config, state, startedAt });
  log(`Done: ${outcome.status}`);
  if (outcome.status === 'completed_with_issues') {
    process.exitCode = 2;
  }
}

async function writeReports({ config, state, startedAt }) {
  const finishedAt = new Date().toISOString();
  const reportDir = path.resolve(process.cwd(), config.reportDir);
  await mkdir(reportDir, { recursive: true });
  const mdPath = path.join(reportDir, `orchestrator-report-${state.runId}.md`);
  const jsonPath = path.join(reportDir, `orchestrator-report-${state.runId}.json`);
  await writeFile(mdPath, buildReportMarkdown({ state, config, startedAt, finishedAt }), 'utf8');
  await writeFile(jsonPath, `${JSON.stringify(buildReportJson({ state, config, startedAt, finishedAt }), null, 2)}\n`, 'utf8');
  state.reportPath = mdPath;
  console.log(`Report written: ${mdPath}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFile } = await import('node:fs/promises');
    await appendFile(process.env.GITHUB_STEP_SUMMARY, buildReportMarkdown({ state, config, startedAt, finishedAt }), 'utf8');
  }
}

main().catch((error) => {
  if (error instanceof ConfigError) {
    console.error(`[orchestrator] configuration error: ${error.message}`);
  } else {
    console.error(`[orchestrator] failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  process.exitCode = 1;
});
