// Durable run state. Persisted as JSON so an interrupted GitHub Actions run
// can be resumed without creating a duplicate Devin session: the session ID is
// recorded before polling starts and reused on every subsequent attempt.

import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function taskHash(taskDescription, acceptanceCriteria) {
  return createHash('sha256')
    .update(`${taskDescription}\n---\n${acceptanceCriteria}`)
    .digest('hex')
    .slice(0, 16);
}

export function initialState({ runId, config }) {
  return {
    schemaVersion: 1,
    runId,
    taskHash: taskHash(config.task.description, config.task.acceptanceCriteria),
    repository: config.task.repository,
    baseBranch: config.task.baseBranch,
    status: 'planned', // planned | implementing | reviewing | correcting | completed | failed
    phase: 'init',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    devinSessionId: null,
    devinSessionUrl: null,
    correctionCycles: 0,
    apiCalls: { openai: 0, devin: 0 },
    brief: null,
    reviews: [],
    devinResults: [],
    reportPath: null,
    failure: null,
  };
}

export async function loadState(statePath) {
  try {
    const raw = await readFile(statePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

export async function saveState(statePath, state) {
  state.updatedAt = new Date().toISOString();
  await mkdir(path.dirname(statePath), { recursive: true });
  const tmp = `${statePath}.tmp`;
  await writeFile(tmp, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  await rename(tmp, statePath);
}

/**
 * Decide whether a persisted state may be resumed for the current inputs.
 * Resuming is only allowed for the same task hash; a different task must start
 * a fresh run so sessions are never cross-wired.
 */
export function resumableState(state, config) {
  if (!state) return null;
  if (state.taskHash !== taskHash(config.task.description, config.task.acceptanceCriteria)) {
    return null;
  }
  // 'failed' states are resumable only when a Devin session exists: retrying
  // re-polls the same session instead of creating a duplicate. If the session
  // already reached a terminal state the poll fails fast again.
  const resumable = ['planned', 'implementing', 'reviewing', 'correcting', 'failed'];
  if (!resumable.includes(state.status)) {
    return null;
  }
  if (state.status === 'failed' && !state.devinSessionId) {
    return null;
  }
  return state;
}
