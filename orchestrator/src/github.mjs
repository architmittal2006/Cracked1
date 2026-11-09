// GitHub evidence collector.
//
// The reviewer must see the actual PR diff, not only Devin's self-reported
// structured output. This module fetches pull-request metadata and diffs via
// the GitHub REST API using the workflow's GITHUB_TOKEN (pull-requests: read).
//
// Endpoints used:
//   GET https://api.github.com/repos/{owner}/{repo}/pulls/{number}
//   GET https://api.github.com/repos/{owner}/{repo}/pulls/{number}  (Accept: diff)

import { requestJson } from './http.mjs';

const MAX_DIFF_CHARS = 60_000;
const MAX_EVIDENCE_CHARS = 120_000;

export function parsePullRequestUrl(url) {
  const match = typeof url === 'string'
    && url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, ''), number: Number.parseInt(match[3], 10) };
}

function truncate(text, max) {
  if (text.length <= max) return { text, truncated: false };
  return { text: `${text.slice(0, max)}\n…[truncated ${text.length - max} chars]`, truncated: true };
}

/**
 * @param {object} opts
 * @param {string} opts.token           GITHUB_TOKEN
 * @param {string[]} opts.pullRequestUrls
 * @param {typeof fetch} [opts.fetchImpl]
 * @param {number} [opts.timeoutMs]
 * @param {number} [opts.maxRetries]
 * @param {(ms:number)=>Promise<void>} [opts.sleep]
 * @returns {Promise<{evidence: Array<object>, errors: string[]}>}
 */
export async function collectPullRequestEvidence({
  token,
  pullRequestUrls,
  fetchImpl,
  timeoutMs = 30000,
  maxRetries = 2,
  sleep,
}) {
  const evidence = [];
  const errors = [];
  const headers = {
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };

  for (const url of pullRequestUrls ?? []) {
    const pr = parsePullRequestUrl(url);
    if (!pr) {
      errors.push(`Unrecognised PR URL: ${url}`);
      continue;
    }
    const apiBase = `https://api.github.com/repos/${pr.owner}/${pr.repo}/pulls/${pr.number}`;
    try {
      const meta = await requestJson({
        url: apiBase,
        headers,
        timeoutMs,
        maxRetries,
        fetchImpl,
        sleep,
      });
      // Patch content comes from the files API (per-file unified diffs).
      const files = await requestJson({
        url: `${apiBase}/files?per_page=100`,
        headers,
        timeoutMs,
        maxRetries,
        fetchImpl,
        sleep,
      });
      const fileList = Array.isArray(files.json) ? files.json : [];
      const patchText = fileList
        .map((f) => `--- ${f.filename} (${f.status}, +${f.additions}/-${f.deletions})\n${f.patch ?? '(binary or too large)'}`)
        .join('\n\n');
      const clipped = truncate(patchText, MAX_DIFF_CHARS);
      evidence.push({
        url,
        title: meta.json?.title ?? null,
        state: meta.json?.state ?? null,
        additions: meta.json?.additions ?? null,
        deletions: meta.json?.deletions ?? null,
        changedFiles: meta.json?.changed_files ?? fileList.length,
        files: fileList.map((f) => f.filename),
        patch: clipped.text,
        patchTruncated: clipped.truncated,
      });
    } catch (error) {
      errors.push(`Could not fetch evidence for ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const total = evidence.reduce((n, e) => n + e.patch.length, 0);
  if (total > MAX_EVIDENCE_CHARS) {
    let remaining = MAX_EVIDENCE_CHARS;
    for (const e of evidence) {
      if (remaining <= 0) { e.patch = ''; e.patchTruncated = true; continue; }
      if (e.patch.length > remaining) {
        e.patch = truncate(e.patch, remaining).text;
        e.patchTruncated = true;
        remaining = 0;
      } else {
        remaining -= e.patch.length;
      }
    }
  }

  return { evidence, errors };
}
