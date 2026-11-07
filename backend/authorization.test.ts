import { afterEach, describe, expect, it } from 'vitest';
import {
  hasCapability,
  isAdminUser,
  isCaseModeratorUser,
  type Capability,
} from './authorization.js';

const ENV_KEYS = ['ADMIN_USER_IDS', 'CASE_MODERATOR_USER_IDS'] as const;
const originalEnv = new Map<string, string | undefined>(
  ENV_KEYS.map((key) => [key, process.env[key]])
);

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const ALL_CAPABILITIES: Capability[] = [
  'admin:accounts:manage',
  'content:read',
  'content:manage',
  'content:publish',
  'case-proposals:moderate',
];

describe('authorization allowlists', () => {
  it('parses comma-separated ids with surrounding whitespace', () => {
    process.env.ADMIN_USER_IDS = ' admin-1 , admin-2 ';
    process.env.CASE_MODERATOR_USER_IDS = 'mod-1, mod-2';

    expect(isAdminUser('admin-1')).toBe(true);
    expect(isAdminUser('admin-2')).toBe(true);
    expect(isAdminUser('admin-3')).toBe(false);
    expect(isCaseModeratorUser('mod-1')).toBe(true);
    expect(isCaseModeratorUser('mod-2')).toBe(true);
    expect(isCaseModeratorUser('mod-3')).toBe(false);
  });

  it('treats empty or unset allowlists as granting nothing', () => {
    delete process.env.ADMIN_USER_IDS;
    delete process.env.CASE_MODERATOR_USER_IDS;

    expect(isAdminUser('anyone')).toBe(false);
    expect(isCaseModeratorUser('anyone')).toBe(false);
    expect(hasCapability('anyone', 'content:manage')).toBe(false);
    expect(hasCapability('anyone', 'content:publish')).toBe(false);
  });
});

describe('hasCapability', () => {
  it('grants admins every capability', () => {
    process.env.ADMIN_USER_IDS = 'admin-1';
    delete process.env.CASE_MODERATOR_USER_IDS;

    for (const capability of ALL_CAPABILITIES) {
      expect(hasCapability('admin-1', capability)).toBe(true);
    }
  });

  it('grants moderators proposal moderation and content read only', () => {
    delete process.env.ADMIN_USER_IDS;
    process.env.CASE_MODERATOR_USER_IDS = 'mod-1';

    expect(hasCapability('mod-1', 'case-proposals:moderate')).toBe(true);
    expect(hasCapability('mod-1', 'content:read')).toBe(true);
    expect(hasCapability('mod-1', 'content:manage')).toBe(false);
    expect(hasCapability('mod-1', 'content:publish')).toBe(false);
    expect(hasCapability('mod-1', 'admin:accounts:manage')).toBe(false);
  });

  it('grants students published-content read access only', () => {
    delete process.env.ADMIN_USER_IDS;
    delete process.env.CASE_MODERATOR_USER_IDS;

    expect(hasCapability('student-1', 'content:read')).toBe(true);
    expect(hasCapability('student-1', 'content:manage')).toBe(false);
    expect(hasCapability('student-1', 'content:publish')).toBe(false);
    expect(hasCapability('student-1', 'admin:accounts:manage')).toBe(false);
    expect(hasCapability('student-1', 'case-proposals:moderate')).toBe(false);
  });

  it('does not trust users.role-style identifiers outside the allowlists', () => {
    delete process.env.ADMIN_USER_IDS;
    delete process.env.CASE_MODERATOR_USER_IDS;

    // Even an id that looks privileged is just a regular user without allowlisting.
    expect(hasCapability('Admin', 'content:publish')).toBe(false);
    expect(hasCapability('Moderator', 'case-proposals:moderate')).toBe(false);
  });

  it('denies every capability to an empty user id', () => {
    process.env.ADMIN_USER_IDS = 'admin-1';
    process.env.CASE_MODERATOR_USER_IDS = 'mod-1';

    for (const capability of ALL_CAPABILITIES) {
      expect(hasCapability('', capability)).toBe(false);
    }
  });
});
