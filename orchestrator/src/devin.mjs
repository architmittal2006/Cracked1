// Devin API v3 client (service-user auth).
// Docs: https://docs.devin.ai/api-reference/v3/sessions
//   POST /v3/organizations/{org_id}/sessions                     create
//   GET  /v3/organizations/{org_id}/sessions/{devin_id}          status/details
//   POST /v3/organizations/{org_id}/sessions/{devin_id}/messages  send message
// Auth: Authorization: Bearer <DEVIN_API_KEY>  (service user token, cog_ prefix)
//
// Session status enum: new | claimed | running | exit | error | suspended | resuming
// status_detail (when running): working | waiting_for_user | waiting_for_approval |
//   finished | ... ; (when suspended): inactivity | out_of_credits | ...

import { requestJson } from './http.mjs';

export class DevinApiError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'DevinApiError';
    this.cause = cause;
  }
}

const TERMINAL_SUCCESS = new Set(['exit']);
const TERMINAL_FAILURE = new Set(['error']);
// suspended covers usage limits, payment, inactivity etc. — always surfaced,
// never silently retried into more spend.
const TERMINAL_BLOCKED = new Set(['suspended']);
const BLOCKED_DETAILS = new Set(['waiting_for_user', 'waiting_for_approval']);

export function isTerminalStatus(session) {
  return TERMINAL_SUCCESS.has(session?.status) || TERMINAL_FAILURE.has(session?.status)
    || TERMINAL_BLOCKED.has(session?.status);
}

export function sessionOutcome(session) {
  // status_detail 'finished' means the agent completed its turn; treat it as
  // success whether the session status is still 'running' or already 'exit'.
  if (session?.status_detail === 'finished') {
    return { done: true, success: true, reason: 'finished' };
  }
  if (session?.status === 'exit') {
    // 'exit' means the agent turn ended; status_detail 'finished' confirms the
    // task completed rather than the session being killed externally.
    if (session.status_detail && session.status_detail !== 'finished') {
      return { done: true, success: false, reason: `session exited with status_detail=${session.status_detail}` };
    }
    return { done: true, success: true, reason: 'finished' };
  }
  if (session?.status === 'error') {
    return { done: true, success: false, reason: `session status=error${session.status_detail ? ` (${session.status_detail})` : ''}` };
  }
  if (session?.status === 'suspended') {
    return { done: true, success: false, reason: `session suspended${session.status_detail ? `: ${session.status_detail}` : ''}` };
  }
  if (BLOCKED_DETAILS.has(session?.status_detail)) {
    return { done: true, success: false, reason: `session needs human input (${session.status_detail})` };
  }
  return { done: false, success: false, reason: `status=${session?.status ?? 'unknown'} detail=${session?.status_detail ?? 'n/a'}` };
}

export function createDevinClient({ apiKey, orgId, baseUrl, timeoutMs, maxRetries, fetchImpl, sleep, onCall }) {
  const base = `${baseUrl}/v3/organizations/${encodeURIComponent(orgId)}/sessions`;
  const headers = { Authorization: `Bearer ${apiKey}` };

  async function call(method, url, body) {
    onCall?.();
    try {
      const { json } = await requestJson({
        url,
        method,
        headers,
        body,
        timeoutMs,
        maxRetries,
        fetchImpl,
        sleep,
      });
      return json;
    } catch (error) {
      throw new DevinApiError(
        `Devin API ${method} ${url} failed: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  return {
    /**
     * @param {object} opts
     * @param {string} opts.prompt
     * @param {string[]} [opts.repos]
     * @param {string} [opts.devinMode]
     * @param {number} [opts.maxAcuLimit]
     * @param {object} [opts.structuredOutputSchema]
     */
    async createSession({ prompt, repos, devinMode, maxAcuLimit, structuredOutputSchema }) {
      const body = {
        prompt,
        repos,
        devin_mode: devinMode,
        max_acu_limit: maxAcuLimit,
        structured_output_required: true,
        structured_output_schema: structuredOutputSchema ?? null,
        resumable: true,
      };
      return call('POST', base, body);
    },

    /** @returns {Promise<object>} SessionResponse */
    async getSession(devinId) {
      return call('GET', `${base}/${encodeURIComponent(devinId)}`, undefined);
    },

    /** Send a follow-up message to an existing session (auto-resumes if suspended). */
    async sendMessage(devinId, message) {
      return call('POST', `${base}/${encodeURIComponent(devinId)}/messages`, { message });
    },
  };
}
