# AI Development Orchestrator

A GitHub Actions-driven pipeline that removes manual prompt-copying between
ChatGPT and Devin for the Cracked repository.

- **OpenAI (Responses API)** — architects the task into a structured
  implementation brief, then independently reviews each Devin result.
- **Devin API v3** — implements the brief, receives up to two corrective
  messages, and reports structured results.
- **GitHub Actions** — orchestration, state persistence, timeouts and reporting.

The workflow is **manual-only** (`workflow_dispatch`). It never merges PRs,
never deploys, and never runs destructive operations.

## Architecture

```
workflow_dispatch (task + acceptance criteria)
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ Job: orchestrate (ubuntu-latest, timeout 300m)          │
│                                                         │
│  1. PLAN     OpenAI structured output → implementation  │
│             brief (incl. devinPrompt)                   │
│  2. IMPLEMENT Devin POST /sessions → poll GET           │
│             /sessions/{id} until terminal               │
│  3. REVIEW   OpenAI verdict: approve | changes_required │
│  4. CORRECT  ≤2 cycles: POST /sessions/{id}/messages    │
│             → re-poll → re-review                       │
│  5. REPORT   markdown + JSON artifacts, step summary    │
└─────────────────────────────────────────────────────────┘
        │
        ▼
State persisted to orchestrator-state.json and committed to
.orchestrator-state/ so retries resume without duplicate sessions.
```

### Components (`orchestrator/`)

| File | Responsibility |
|---|---|
| `src/config.mjs` | Env-driven configuration and limits; refuses correction cycles > 2 |
| `src/http.mjs` | JSON HTTP client: timeouts, retry/backoff, `Retry-After`, 429/5xx handling, secret-safe errors |
| `src/openai.mjs` | Responses API client with strict `json_schema` structured outputs |
| `src/devin.mjs` | Devin v3 sessions client + terminal-status mapping |
| `src/state.mjs` | Durable run state, task hashing, resume rules |
| `src/prompts.mjs` | Prompt builders, JSON schemas, project-doc context loader |
| `src/orchestrator.mjs` | The plan → implement → review → correct loop |
| `src/report.mjs` | Final markdown/JSON report |
| `src/cli.mjs` | Entry point used by the workflow |
| `test/` | Mocked unit + end-to-end tests (zero API credits) |

## APIs used (verified against official docs)

### OpenAI — Responses API

- `POST https://api.openai.com/v1/responses`
- Auth: `Authorization: Bearer $OPENAI_API_KEY`
- Structured output: `text.format = { type: "json_schema", name, strict: true, schema }`
- Docs: <https://developers.openai.com/api/docs/guides/structured-outputs>
- Response text extracted from `output_text` or `output[].content[]`.

### Devin — API v3 (service users)

- `POST https://api.devin.ai/v3/organizations/{org_id}/sessions`
  body: `{ prompt, repos, devin_mode, max_acu_limit, structured_output_required: true, structured_output_schema }`
- `GET  https://api.devin.ai/v3/organizations/{org_id}/sessions/{devin_id}`
- `POST https://api.devin.ai/v3/organizations/{org_id}/sessions/{devin_id}/messages`
  body: `{ message }`
- Auth: `Authorization: Bearer $DEVIN_API_KEY` (service-user token, `cog_` prefix)
- Session statuses: `new | claimed | running | exit | error | suspended | resuming`;
  `status_detail` includes `working | waiting_for_user | waiting_for_approval |
  finished` and suspension reasons (`out_of_credits`, `usage_limit_exceeded`, …).
- The orchestrator treats `exit`, `error`, `suspended`, and
  `waiting_for_user`/`waiting_for_approval` as terminal; only
  `finished`/clean `exit` counts as success.
- Docs: <https://docs.devin.ai/api-reference/v3/sessions>

## Setup

### 1. Secrets (repository → Settings → Secrets and variables → Actions)

| Secret | Source |
|---|---|
| `OPENAI_API_KEY` | OpenAI platform key with Responses API access |
| `DEVIN_API_KEY` | Devin service-user token (`cog_…`) with `UseDevinSessions` (`org.devins.use`) |
| `DEVIN_ORG_ID` | Devin organization ID (`org-…`); may be a secret **or** an Actions variable |

The Devin service user only needs session create/read/message permissions.
Do **not** grant merge or deployment permissions to it for this workflow.

### 2. Run

GitHub → Actions → **AI Development Orchestrator** → *Run workflow*, then fill in:

- `task_description` — what Devin should build/fix
- `acceptance_criteria` — verifiable criteria (one per line)
- optional: `repository`, `base_branch`, `openai_model`, `devin_mode`,
  `devin_max_acu_limit`, `max_poll_minutes`, `max_openai_calls`,
  `max_correction_cycles` (hard-capped at 2)

### 3. Outputs

- Step summary + artifacts `orchestrator-reports-<run>-<attempt>` (markdown + JSON)
- State artifacts `orchestrator-state-<run>-<attempt>`
- `orchestrator-state.json` committed to the branch under
  `.orchestrator-state/` for resume/audit

## Resume & duplicate-session protection

- The Devin `session_id` is persisted **immediately** after creation, before
  polling. Any retry (re-run failed job, workflow re-dispatch with identical
  inputs) reuses the recorded session — `createSession` is never called twice
  for the same task.
- Resume only happens when the persisted `taskHash` (SHA-256 of task +
  criteria) matches the current inputs. A different task always starts fresh.
- A `failed` state resumes only if a session ID exists; terminal Devin states
  fail fast again instead of looping.

## Cost controls

| Control | Default | Input |
|---|---|---|
| Correction cycles | 2 (hard cap, enforced in code) | `max_correction_cycles` |
| Devin spend | `max_acu_limit` per session | `devin_max_acu_limit` (default 10 ACU) |
| Polling timeout | 90 min per round | `max_poll_minutes` |
| OpenAI calls | 12 | `max_openai_calls` |
| Devin API calls | 200 | (env `ORCHESTRATOR_MAX_DEVIN_CALLS`) |
| Job timeout | 300 min | workflow `timeout-minutes` |
| Devin mode | `normal` | `devin_mode` (`lite` is cheaper) |

Typical cost shape: 1 architect call + 1 review call per round (+1 per
correction). Devin cost dominates and is bounded by `max_acu_limit` and
`devin_mode`. Set `devin_mode: lite` and a low ACU cap for cheap tasks.

## Testing

```bash
cd orchestrator
npm test        # 35 mocked tests — no API credits consumed
```

Coverage includes: HTTP retry/backoff/429/secret-sanitization, OpenAI request
shape and structured-output parsing, Devin endpoint/payload/status mapping,
the full orchestration loop (approve, one/two corrections, budgets, timeout,
resume without duplicate sessions), state persistence, and CLI end-to-end runs
against a local mock HTTP server.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `Missing required environment variables` | Secret not set or `DEVIN_ORG_ID` neither secret nor variable |
| `Devin API … 401/403` | Token lacks `org.devins.use`, wrong org ID, or token expired |
| `Devin API … 429` | Rate limited — client retries with backoff; reduce poll frequency via `ORCHESTRATOR_POLL_INTERVAL_SECONDS` |
| `Timed out after … waiting for Devin session` | Task too large or Devin stuck; check the session URL in the Devin app, then re-run (it resumes the same session) |
| `session suspended: out_of_credits` / `usage_limit_exceeded` | Devin quota exhausted — raise plan quota or lower `devin_max_acu_limit`/`devin_mode` |
| `session needs human input (waiting_for_approval)` | Devin safe-mode approval required — approve in the Devin UI, then re-run the workflow to resume |
| `API call budget exhausted` | Raise `max_openai_calls` or simplify the task |
| Review keeps requesting changes | After 2 cycles the run ends `completed_with_issues`; the report lists outstanding issues for a human |
| Duplicate session feared | Check `.orchestrator-state/latest.json` — `devinSessionId` is reused; sessions are only created when it is null |

## Safety

- `permissions: contents: write` is required **only** to commit the state file
  on this automation branch. The workflow cannot merge PRs.
- All Devin sessions run on their own branches/PRs; humans review and merge.
- Secrets are never logged: the HTTP layer strips `Authorization`/key material
  from error messages, and reports contain only links, statuses and outcomes.
- No production backend/frontend code is modified by this infrastructure.
