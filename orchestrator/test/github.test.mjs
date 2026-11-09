import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectPullRequestEvidence, parsePullRequestUrl } from '../src/github.mjs';

function mockGithub(pullNumber = 42) {
  return async (url) => {
    const u = new URL(url);
    if (u.pathname.endsWith(`/pulls/${pullNumber}`)) {
      return new Response(JSON.stringify({
        title: 'Add health endpoint', state: 'open', additions: 10, deletions: 2, changed_files: 1,
      }), { status: 200 });
    }
    if (u.pathname.endsWith(`/pulls/${pullNumber}/files`)) {
      return new Response(JSON.stringify([{
        filename: 'backend/server.ts', status: 'modified', additions: 10, deletions: 2,
        patch: '@@ -1 +1 @@\n+app.get("/api/health"',
      }]), { status: 200 });
    }
    return new Response('{}', { status: 404 });
  };
}

test('parsePullRequestUrl extracts owner/repo/number', () => {
  assert.deepEqual(
    parsePullRequestUrl('https://github.com/architmittal2006/Cracked1/pull/123'),
    { owner: 'architmittal2006', repo: 'Cracked1', number: 123 }
  );
  assert.equal(parsePullRequestUrl('https://example.com/x'), null);
  assert.equal(parsePullRequestUrl('not a url'), null);
});

test('collectPullRequestEvidence returns metadata and patches', async () => {
  const { evidence, errors } = await collectPullRequestEvidence({
    token: 'ghp-test',
    pullRequestUrls: ['https://github.com/o/r/pull/42'],
    fetchImpl: mockGithub(42),
    timeoutMs: 1000,
    maxRetries: 0,
  });
  assert.equal(errors.length, 0);
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].title, 'Add health endpoint');
  assert.equal(evidence[0].changedFiles, 1);
  assert.deepEqual(evidence[0].files, ['backend/server.ts']);
  assert.match(evidence[0].patch, /api\/health/);
});

test('unrecognised URLs and fetch failures are reported, not thrown', async () => {
  const { evidence, errors } = await collectPullRequestEvidence({
    token: 'ghp-test',
    pullRequestUrls: ['https://example.com/not-a-pr', 'https://github.com/o/r/pull/42'],
    fetchImpl: async () => new Response('nope', { status: 500 }),
    timeoutMs: 1000,
    maxRetries: 0,
  });
  assert.equal(evidence.length, 0);
  assert.equal(errors.length, 2);
});

test('empty PR list yields empty evidence', async () => {
  const { evidence, errors } = await collectPullRequestEvidence({ token: 't', pullRequestUrls: [] });
  assert.deepEqual(evidence, []);
  assert.deepEqual(errors, []);
});
