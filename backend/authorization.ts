export type Capability =
  | 'admin:accounts:manage'
  | 'content:read'
  | 'content:manage'
  | 'content:publish'
  | 'case-proposals:moderate';

const userIdsFor = (environmentVariable: string): Set<string> =>
  new Set(
    (process.env[environmentVariable] || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  );

export const isAdminUser = (userId: string): boolean =>
  userIdsFor('ADMIN_USER_IDS').has(userId);

export const isCaseModeratorUser = (userId: string): boolean =>
  userIdsFor('CASE_MODERATOR_USER_IDS').has(userId);

const ADMIN_CAPABILITIES: readonly Capability[] = [
  'admin:accounts:manage',
  'content:read',
  'content:manage',
  'content:publish',
  'case-proposals:moderate',
];

const CASE_MODERATOR_CAPABILITIES: readonly Capability[] = [
  'case-proposals:moderate',
];

// Every authenticated user may read published content. Requests without a
// session user never reach capability checks, but an empty id is denied
// defensively so unauthenticated callers cannot gain read access.
const BASE_CAPABILITIES: readonly Capability[] = ['content:read'];

export function hasCapability(userId: string, capability: Capability): boolean {
  if (!userId) {
    return false;
  }
  if (isAdminUser(userId)) {
    return ADMIN_CAPABILITIES.includes(capability);
  }

  const granted = isCaseModeratorUser(userId)
    ? [...BASE_CAPABILITIES, ...CASE_MODERATOR_CAPABILITIES]
    : BASE_CAPABILITIES;
  return granted.includes(capability);
}
