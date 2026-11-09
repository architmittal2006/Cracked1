// Final run report: markdown for the workflow summary/artifact plus a JSON
// sidecar. Contains no secrets — only task metadata, links and outcomes.

export function buildReportMarkdown({ state, config, startedAt, finishedAt }) {
  const lines = [];
  lines.push(`# AI Orchestrator Report — ${state.runId}`);
  lines.push('');
  lines.push(`- **Repository:** ${state.repository}`);
  lines.push(`- **Base branch:** ${state.baseBranch}`);
  lines.push(`- **Status:** ${state.status}${state.failure ? ` — ${state.failure}` : ''}`);
  lines.push(`- **Started:** ${startedAt}`);
  lines.push(`- **Finished:** ${finishedAt}`);
  lines.push(`- **Correction cycles used:** ${state.correctionCycles}/${config.limits.maxCorrectionCycles}`);
  lines.push(`- **API calls:** OpenAI ${state.apiCalls.openai}, Devin ${state.apiCalls.devin}`);
  if (state.devinSessionUrl) lines.push(`- **Devin session:** ${state.devinSessionUrl}`);
  lines.push('');

  if (state.brief) {
    lines.push('## Implementation brief');
    lines.push('');
    lines.push(`**${state.brief.title}**`);
    lines.push('');
    lines.push(state.brief.summary);
    lines.push('');
    lines.push('### Plan');
    for (const step of state.brief.planSteps ?? []) lines.push(`- ${step}`);
    lines.push('');
    lines.push('### Files expected to change');
    for (const f of state.brief.filesToTouch ?? []) lines.push(`- \`${f}\``);
    lines.push('');
  }

  lines.push('## Devin results');
  lines.push('');
  state.devinResults.forEach((r, i) => {
    lines.push(`### Round ${i + 1}`);
    lines.push('');
    lines.push(`- Session: ${r.url ?? r.sessionId ?? 'n/a'}`);
    lines.push(`- Status: ${r.status}${r.statusDetail ? ` (${r.statusDetail})` : ''}`);
    if (r.acusConsumed != null) lines.push(`- ACUs consumed: ${r.acusConsumed}`);
    if (r.onDemandUsageUsd != null) lines.push(`- On-demand usage: $${r.onDemandUsageUsd}`);
    const so = r.structuredOutput;
    if (so) {
      lines.push(`- Summary: ${so.summary ?? 'n/a'}`);
      lines.push(`- Files changed: ${(so.filesChanged ?? []).map((f) => `\`${f}\``).join(', ') || 'n/a'}`);
      lines.push(`- Tests run: ${(so.testsRun ?? []).join('; ') || 'none reported'}`);
      lines.push(`- Test results: ${so.testResults ?? 'n/a'}`);
      if (so.pullRequestUrl) lines.push(`- Pull request: ${so.pullRequestUrl}`);
      const prs = (r.pullRequests ?? []).map((p) => p?.url ?? JSON.stringify(p));
      if (prs.length) lines.push(`- Session PRs: ${prs.join(', ')}`);
      if ((so.outstandingIssues ?? []).length) {
        lines.push('- Outstanding issues:');
        for (const issue of so.outstandingIssues) lines.push(`  - ${issue}`);
      }
    }
    lines.push('');
  });

  lines.push('## GPT reviews');
  lines.push('');
  if (!state.reviews.length) {
    lines.push('No reviews recorded.');
  }
  state.reviews.forEach((r, i) => {
    lines.push(`### Review ${i + 1} (after round ${r.cycle + 1}) — ${r.verdict.verdict}`);
    lines.push('');
    lines.push(r.verdict.summary);
    if ((r.verdict.issues ?? []).length) {
      lines.push('');
      lines.push('Issues:');
      for (const issue of r.verdict.issues) lines.push(`- ${issue}`);
    }
    lines.push('');
  });

  lines.push('## Safety notes');
  lines.push('');
  lines.push('- No merge or deployment was performed by this workflow.');
  lines.push('- Human approval is required before any PR is merged or deployed.');
  lines.push('- API budgets: OpenAI calls, Devin calls, poll time and ACU limit are capped by workflow inputs.');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

export function buildReportJson({ state, config, startedAt, finishedAt }) {
  return {
    runId: state.runId,
    status: state.status,
    failure: state.failure,
    repository: state.repository,
    baseBranch: state.baseBranch,
    devinSessionId: state.devinSessionId,
    devinSessionUrl: state.devinSessionUrl,
    correctionCycles: state.correctionCycles,
    apiCalls: state.apiCalls,
    brief: state.brief,
    devinResults: state.devinResults,
    reviews: state.reviews,
    startedAt,
    finishedAt,
    limits: config.limits,
  };
}
