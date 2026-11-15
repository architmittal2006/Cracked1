import { describe, expect, it, afterEach } from 'vitest';
import { resolveReviewerTier } from './authorization.js';

// Unit coverage for server-side reviewer tier resolution. The tier is derived
// exclusively from server env allowlists — clients can never supply it.
describe('resolveReviewerTier', () => {
  const ORIGINAL_ADMIN = process.env.ADMIN_USER_IDS;
  const ORIGINAL_MODS = process.env.CASE_MODERATOR_USER_IDS;
  const ORIGINAL_ARBITERS = process.env.PEER_REVIEW_ARBITER_USER_IDS;

  afterEach(() => {
    if (ORIGINAL_ADMIN === undefined) delete process.env.ADMIN_USER_IDS;
    else process.env.ADMIN_USER_IDS = ORIGINAL_ADMIN;
    if (ORIGINAL_MODS === undefined) delete process.env.CASE_MODERATOR_USER_IDS;
    else process.env.CASE_MODERATOR_USER_IDS = ORIGINAL_MODS;
    if (ORIGINAL_ARBITERS === undefined) delete process.env.PEER_REVIEW_ARBITER_USER_IDS;
    else process.env.PEER_REVIEW_ARBITER_USER_IDS = ORIGINAL_ARBITERS;
  });

  it('returns General for a regular user', () => {
    delete process.env.ADMIN_USER_IDS;
    delete process.env.CASE_MODERATOR_USER_IDS;
    expect(resolveReviewerTier('user_plain')).toBe('General');
  });

  it('returns Verified for case moderators', () => {
    delete process.env.ADMIN_USER_IDS;
    process.env.CASE_MODERATOR_USER_IDS = 'mod_1, mod_2';
    expect(resolveReviewerTier('mod_2')).toBe('Verified');
    expect(resolveReviewerTier('user_plain')).toBe('General');
  });

  it('returns Arbiter only for the dedicated arbitration allowlist', () => {
    process.env.ADMIN_USER_IDS = 'admin_1';
    process.env.CASE_MODERATOR_USER_IDS = 'mod_1';
    process.env.PEER_REVIEW_ARBITER_USER_IDS = 'arbiter_1';
    expect(resolveReviewerTier('arbiter_1')).toBe('Arbiter');
    // Platform admins do NOT gain arbitration authority implicitly.
    expect(resolveReviewerTier('admin_1')).toBe('General');
    expect(resolveReviewerTier('mod_1')).toBe('Verified');
    expect(resolveReviewerTier('user_plain')).toBe('General');
  });

  it('does not grant tiers for empty or whitespace-padded mismatches', () => {
    process.env.PEER_REVIEW_ARBITER_USER_IDS = ' arbiter_1 ';
    process.env.ADMIN_USER_IDS = 'admin_1';
    process.env.CASE_MODERATOR_USER_IDS = '';
    expect(resolveReviewerTier('arbiter_1')).toBe('Arbiter');
    expect(resolveReviewerTier('arbiter_1 ')).toBe('General');
    expect(resolveReviewerTier('')).toBe('General');
  });
});
