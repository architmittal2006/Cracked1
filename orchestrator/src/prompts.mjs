// Prompt construction, JSON schemas for structured outputs, and project-context
// loading. GPT receives the task plus Cracked's engineering documentation so
// briefs respect existing architecture and product decisions.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

// Ordered by decision-relevance: agent rules and architecture first, README last.
const CONTEXT_FILES = [
  'docs/AGENTS.md',
  'docs/SYSTEM_ARCHITECTURE.md',
  'docs/IMPLEMENTATION_ROADMAP.md',
  'docs/OPEN_DECISIONS.md',
  'docs/PRODUCT.md',
  'docs/DOMAIN_MODEL.md',
  'docs/ACTORS_AND_PERMISSIONS.md',
  'docs/PRODUCT_WORKFLOWS.md',
  'docs/CONTENT_OPERATIONS.md',
  'docs/FAILURE_AND_RECOVERY.md',
  'README.md',
];

// Context budget must keep the whole Responses API request under the LLM
// provider's per-minute token cap. Groq free tier is ~8K TPM for gpt-oss
// models; ~3.5 chars/token means 12K chars ≈ 3.4K tokens of context, leaving
// ample room for instructions, schemas and the task text.
const DEFAULT_MAX_CONTEXT_CHARS = 12_000;

export function maxContextChars(env = process.env) {
  const raw = env.ORCHESTRATOR_MAX_CONTEXT_CHARS;
  if (raw === undefined || raw === '') return DEFAULT_MAX_CONTEXT_CHARS;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_MAX_CONTEXT_CHARS;
}

/** Load project docs that exist in the checkout; missing files are skipped. */
export async function loadProjectContext(repoRoot, env = process.env) {
  const parts = [];
  let total = 0;
  for (const rel of CONTEXT_FILES) {
    try {
      const text = await readFile(path.join(repoRoot, rel), 'utf8');
      const chunk = `\n\n===== ${rel} =====\n${text}`;
      // Skip oversized docs and continue — a large file must not starve the
      // smaller high-priority docs that follow it.
      if (total + chunk.length > maxContextChars(env)) continue;
      parts.push(chunk);
      total += chunk.length;
    } catch {
      // File absent on this branch — skip.
    }
  }
  // Include any additional docs not in the canonical list, if budget remains.
  try {
    const entries = await readdir(path.join(repoRoot, 'docs'));
    for (const entry of entries.sort()) {
      if (!entry.endsWith('.md') || CONTEXT_FILES.includes(`docs/${entry}`)) continue;
      try {
        const text = await readFile(path.join(repoRoot, 'docs', entry), 'utf8');
        const chunk = `\n\n===== docs/${entry} =====\n${text}`;
        if (total + chunk.length > maxContextChars(env)) continue;
        parts.push(chunk);
        total += chunk.length;
      } catch { /* skip */ }
    }
  } catch { /* no docs dir */ }
  return parts.join('');
}

export const IMPLEMENTATION_BRIEF_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'summary', 'planSteps', 'filesToTouch', 'acceptanceMapping', 'risks', 'devinPrompt'],
  properties: {
    title: { type: 'string', description: 'Short imperative title for the change' },
    summary: { type: 'string', description: 'What will be built and why' },
    planSteps: {
      type: 'array',
      items: { type: 'string' },
      description: 'Ordered implementation steps for the coding agent',
    },
    filesToTouch: {
      type: 'array',
      items: { type: 'string' },
      description: 'Repository-relative paths expected to be created or modified',
    },
    acceptanceMapping: {
      type: 'array',
      items: { type: 'string' },
      description: 'How each acceptance criterion will be satisfied and verified',
    },
    risks: {
      type: 'array',
      items: { type: 'string' },
      description: 'Risks, edge cases and things the implementer must not break',
    },
    devinPrompt: {
      type: 'string',
      description: 'Complete, self-contained implementation prompt to send to the Devin session',
    },
  },
};

export const REVIEW_VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict', 'issues', 'correctiveInstructions', 'summary'],
  properties: {
    verdict: { type: 'string', enum: ['approve', 'changes_required'] },
    summary: { type: 'string', description: 'One-paragraph assessment of the implementation' },
    issues: {
      type: 'array',
      items: { type: 'string' },
      description: 'Concrete defects or acceptance gaps found; empty when approving',
    },
    correctiveInstructions: {
      type: 'string',
      description: 'Precise instructions for the next Devin correction cycle; empty when approving',
    },
  },
};

export const DEVIN_STRUCTURED_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'filesChanged', 'testsRun', 'testResults', 'pullRequestUrl', 'outstandingIssues'],
  properties: {
    summary: { type: 'string' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    testsRun: { type: 'array', items: { type: 'string' } },
    testResults: { type: 'string', description: 'Pass/fail outcome of the verification commands actually run' },
    pullRequestUrl: { type: 'string', description: 'URL of the PR opened, or empty string' },
    outstandingIssues: { type: 'array', items: { type: 'string' } },
  },
};

const SAFETY_RULES = `Safety rules you must encode in every brief:
- Work only inside the repository on an isolated branch; never push to or merge into main/production branches.
- Never deploy anything; never run destructive database operations.
- Preserve existing architecture, conventions and product decisions documented in the project context.
- Do not add paid infrastructure or unnecessary dependencies.
- All buttons/features shipped must actually work; no mock data in production flows.
- Include verification steps (tests/build/lint) appropriate to the change.`;

export function buildArchitectInput({ task, acceptanceCriteria, context }) {
  return [
    `Repository: ${task.repository}`,
    `Base branch: ${task.baseBranch}`,
    '',
    '## Development task',
    task.description,
    '',
    '## Acceptance criteria',
    acceptanceCriteria,
    '',
    '## Project context (documentation excerpts)',
    context || '(no documentation available)',
  ].join('\n');
}

export const ARCHITECT_INSTRUCTIONS = `You are the architect/planner for "Cracked", a consulting interview preparation platform.
Given a development task and the project's documentation, produce a structured implementation brief.
The brief's devinPrompt must be a complete, self-contained prompt for an autonomous coding agent:
it must state the goal, relevant files/conventions, constraints, and required verification.
Do not ask questions; make reasonable decisions consistent with the documentation.`;

export function buildReviewInput({ task, acceptanceCriteria, brief, devinResult, evidence, evidenceErrors }) {
  const prUrls = (devinResult?.pullRequests ?? []).map((p) => p?.url ?? p).filter(Boolean);
  // Cap patch text so the review request stays under the LLM input-token
  // budget (~3.5 chars/token). Full patches remain in state/report artifacts.
  const PATCH_PROMPT_CHARS = 12_000;
  let patchBudget = PATCH_PROMPT_CHARS;
  const evidenceSection = evidence?.length
    ? evidence.map((e) => {
        let patch = e.patch || '(no patch content available)';
        if (patch.length > patchBudget) {
          patch = `${patch.slice(0, patchBudget)}\n…[patch truncated for prompt budget]`;
        }
        patchBudget = Math.max(0, patchBudget - patch.length);
        return [
          `### ${e.title ?? 'PR'} — ${e.url}`,
          `state=${e.state} +${e.additions}/-${e.deletions} files=${e.changedFiles}`,
          `changed files: ${(e.files ?? []).join(', ')}`,
          '```diff',
          patch,
          '```',
        ].join('\n');
      }).join('\n\n')
    : '(no pull-request diffs could be retrieved — review must rely on the agent\'s self-report and treat unverified claims with suspicion)';

  const errorNote = evidenceErrors?.length
    ? `\nEvidence fetch problems: ${evidenceErrors.join('; ')}`
    : '';

  return [
    `Repository: ${task.repository}`,
    `Base branch: ${task.baseBranch}`,
    '',
    '## Original task',
    task.description,
    '',
    '## Acceptance criteria',
    acceptanceCriteria,
    '',
    '## Implementation brief given to the coding agent',
    JSON.stringify(brief, null, 2),
    '',
    '## Coding agent self-reported result (UNVERIFIED claims)',
    JSON.stringify(devinResult, null, 2),
    '',
    `## Pull requests opened (${prUrls.length || 'none'})`,
    prUrls.length ? prUrls.join('\n') : 'The agent reported no pull request.',
    '',
    '## Actual diff evidence fetched from GitHub (AUTHORITATIVE)',
    evidenceSection + errorNote,
    '',
    'Review instructions: the diff evidence above is authoritative — verify the code',
    'actually implements the task and meets every acceptance criterion. The agent\'s',
    'self-reported test results are claims, not proof; flag any criterion that the',
    'diff does not demonstrably satisfy. Approve only if every criterion is credibly',
    'met by the diff and no regressions are introduced. Otherwise list concrete',
    'issues and write corrective instructions specific enough for the coding agent.',
  ].join('\n');
}

export const REVIEW_INSTRUCTIONS = `You are an independent senior code reviewer for the Cracked repository.
You did not write this code. Review it strictly against the task, acceptance criteria and
project conventions. Reject work that is incomplete, breaks existing behaviour, violates the
safety rules, or claims tests that were not run. When changes are required, your corrective
instructions must be actionable and minimal.`;

export function buildCorrectionMessage({ review, cycle }) {
  return [
    `Correction cycle ${cycle}/2 — independent review requested changes.`,
    '',
    'Reviewer summary:',
    review.summary,
    '',
    'Issues to fix:',
    ...(review.issues.length ? review.issues.map((i) => `- ${i}`) : ['- (see instructions)']),
    '',
    'Instructions:',
    review.correctiveInstructions,
    '',
    'Keep the change minimal, preserve existing behaviour, re-run the relevant verification,',
    'and update your structured output when finished.',
  ].join('\n');
}
