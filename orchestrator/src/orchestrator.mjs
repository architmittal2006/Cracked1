// Orchestration loop:
//   PLAN (GPT brief) -> IMPLEMENT (create Devin session, poll) -> REVIEW (GPT)
//   -> up to MAX_CORRECTION_CYCLES x (send corrective message, poll, review)
//   -> REPORT
//
// All side effects go through injected clients and a persisted state object so
// interrupted runs resume without duplicating Devin sessions.

import {
  IMPLEMENTATION_BRIEF_SCHEMA,
  REVIEW_VERDICT_SCHEMA,
  DEVIN_STRUCTURED_OUTPUT_SCHEMA,
  ARCHITECT_INSTRUCTIONS,
  REVIEW_INSTRUCTIONS,
  buildArchitectInput,
  buildReviewInput,
  buildCorrectionMessage,
} from './prompts.mjs';
import { sessionOutcome } from './devin.mjs';
import { saveState } from './state.mjs';

export class OrchestratorError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OrchestratorError';
  }
}

function devinResultFromSession(session) {
  return {
    sessionId: session?.session_id ?? null,
    status: session?.status ?? null,
    statusDetail: session?.status_detail ?? null,
    pullRequests: session?.pull_requests ?? [],
    acusConsumed: session?.acus_consumed ?? null,
    onDemandUsageUsd: session?.on_demand_usage ?? null,
    structuredOutput: session?.structured_output ?? null,
    url: session?.url ?? null,
  };
}

/**
 * @param {object} deps
 * @param {object} deps.config      from loadConfig()
 * @param {object} deps.state       mutable run state (persisted by caller hooks)
 * @param {object} deps.openai      client with .structured()
 * @param {object} deps.devin       client with createSession/getSession/sendMessage
 * @param {(state:object)=>Promise<void>} deps.persist
 * @param {(ms:number)=>Promise<void>} [deps.sleep]
 * @param {()=>number} [deps.now]
 * @param {(msg:string)=>void} [deps.log]
 */
export async function runOrchestrator(deps) {
  const { config, state, openai, devin, persist, log = () => {} } = deps;
  const sleep = deps.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  const now = deps.now ?? (() => Date.now());
  const limits = config.limits;

  const guard = (kind) => {
    if (state.apiCalls[kind] >= limits[kind === 'openai' ? 'maxOpenAiCalls' : 'maxDevinCalls']) {
      throw new OrchestratorError(`API call budget exhausted for ${kind} (${state.apiCalls[kind]})`);
    }
    state.apiCalls[kind] += 1;
  };

  const save = async (phase) => {
    state.phase = phase;
    await persist(state);
  };

  // ---------- Phase 1: architect brief ----------
  if (!state.brief) {
    await save('planning');
    guard('openai');
    const brief = await openai.structured({
      instructions: ARCHITECT_INSTRUCTIONS,
      input: buildArchitectInput({
        task: config.task,
        acceptanceCriteria: config.task.acceptanceCriteria,
        context: deps.projectContext ?? '',
      }),
      schemaName: 'implementation_brief',
      schema: IMPLEMENTATION_BRIEF_SCHEMA,
    });
    state.brief = brief;
    await save('planned');
    log(`Brief ready: ${brief.title}`);
  } else {
    log('Resuming with existing brief');
  }

  // ---------- Phase 2+: implement / correct / review ----------
  const pollDeadlineMs = limits.maxPollMinutes * 60 * 1000;

  const pollSession = async () => {
    const deadline = now() + pollDeadlineMs;
    let lastStatus = '';
    for (;;) {
      guard('devin');
      const session = await devin.getSession(state.devinSessionId);
      const outcome = sessionOutcome(session);
      const tag = `status=${session?.status ?? '?'} detail=${session?.status_detail ?? '-'}`;
      if (tag !== lastStatus) {
        log(`Devin ${state.devinSessionId}: ${tag}`);
        lastStatus = tag;
      }
      if (outcome.done) {
        if (!outcome.success) {
          throw new OrchestratorError(`Devin session failed: ${outcome.reason}`);
        }
        return session;
      }
      if (now() >= deadline) {
        throw new OrchestratorError(
          `Timed out after ${limits.maxPollMinutes}m waiting for Devin session ${state.devinSessionId} (${tag})`
        );
      }
      await sleep(limits.pollIntervalSeconds * 1000);
    }
  };

  const ensureSession = async () => {
    if (state.devinSessionId) {
      log(`Resuming existing Devin session ${state.devinSessionId} (no duplicate created)`);
      return;
    }
    await save('creating_session');
    guard('devin');
    const created = await devin.createSession({
      prompt: state.brief.devinPrompt,
      repos: [config.task.repository],
      devinMode: config.devin.mode,
      maxAcuLimit: config.devin.maxAcuLimit,
      structuredOutputSchema: DEVIN_STRUCTURED_OUTPUT_SCHEMA,
    });
    state.devinSessionId = created?.session_id ?? null;
    state.devinSessionUrl = created?.url ?? null;
    if (!state.devinSessionId) {
      throw new OrchestratorError('Devin create-session response did not include session_id');
    }
    // Persist immediately: a crash after this point must never create a second session.
    await persist(state);
    log(`Devin session created: ${state.devinSessionId} ${state.devinSessionUrl ?? ''}`.trim());
  };

  const attachEvidence = async (result) => {
    if (!deps.collectEvidence) return;
    try {
      const { evidence, errors } = await deps.collectEvidence(result);
      result.evidence = evidence;
      result.evidenceErrors = errors;
      if (errors.length) log(`Evidence warnings: ${errors.join('; ')}`);
    } catch (error) {
      result.evidence = [];
      result.evidenceErrors = [error instanceof Error ? error.message : String(error)];
      log(`Evidence collection failed: ${result.evidenceErrors[0]}`);
    }
  };

  const review = async (devinResult) => {
    guard('openai');
    const verdict = await openai.structured({
      instructions: REVIEW_INSTRUCTIONS,
      input: buildReviewInput({
        task: config.task,
        acceptanceCriteria: config.task.acceptanceCriteria,
        brief: state.brief,
        devinResult,
        evidence: devinResult.evidence,
        evidenceErrors: devinResult.evidenceErrors,
      }),
      schemaName: 'review_verdict',
      schema: REVIEW_VERDICT_SCHEMA,
    });
    state.reviews.push({ at: new Date().toISOString(), cycle: state.correctionCycles, verdict });
    await persist(state);
    return verdict;
  };

  // Initial implementation (or resume mid-flight).
  if (!state.devinResults.length) {
    await ensureSession();
    await save('implementing');
    const session = await pollSession();
    const result = devinResultFromSession(session);
    await attachEvidence(result);
    state.devinResults.push(result);
    await save('implemented');
  } else {
    log('Resuming after recorded implementation result');
  }

  // Review + correction loop (max two correction cycles).
  for (;;) {
    const lastResult = state.devinResults[state.devinResults.length - 1];
    await save('reviewing');
    const verdict = await review(lastResult);
    log(`Review verdict: ${verdict.verdict}`);

    if (verdict.verdict === 'approve') {
      state.status = 'completed';
      await persist(state);
      return { status: 'completed', state };
    }

    if (state.correctionCycles >= limits.maxCorrectionCycles) {
      state.status = 'completed'; // finished, but with unresolved review issues
      state.failure = `Review still requires changes after ${limits.maxCorrectionCycles} correction cycles`;
      await persist(state);
      return { status: 'completed_with_issues', state };
    }

    state.correctionCycles += 1;
    await save('correcting');
    guard('devin');
    await devin.sendMessage(
      state.devinSessionId,
      buildCorrectionMessage({ review: verdict, cycle: state.correctionCycles })
    );
    await save('implementing');
    const session = await pollSession();
    const result = devinResultFromSession(session);
    await attachEvidence(result);
    state.devinResults.push(result);
    await save('implemented');
  }
}

