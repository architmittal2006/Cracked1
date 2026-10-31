import { describe, expect, it } from 'vitest';
import { casebookInputSchema } from './casebookValidation.js';

const validCasebook = {
  title: 'Public strategy casebook',
  sourceOrg: 'Example contributor',
  sourceKind: 'original',
  year: 2025,
  description: 'A short catalog description written by the contributor.',
  licenseKind: 'original',
  permissionReference: 'Written by the contributor.',
  externalUrl: '',
  industries: ['Retail'],
  cases: [{
    title: 'Retail expansion',
    firm: null,
    sector: 'Retail',
    caseType: 'Market Entry',
    difficulty: 'Standard',
    summary: 'A contributor-written summary in their own words.',
    body: 'Original body text.',
    position: 0,
    practiceCaseId: null,
  }],
  rightsConfirmed: true,
  attributionConfirmed: true,
};

describe('casebook rights validation', () => {
  it('accepts hosted text with an explicit rights basis and confirmations', () => {
    expect(casebookInputSchema.safeParse(validCasebook).success).toBe(true);
  });

  it('requires a source URL and rejects hosted text for link-only entries', () => {
    const result = casebookInputSchema.safeParse({
      ...validCasebook,
      licenseKind: 'link_only',
      permissionReference: '',
      externalUrl: '',
    });
    expect(result.success).toBe(false);
  });

  it('requires an explicit rights reference and both confirmations', () => {
    expect(casebookInputSchema.safeParse({
      ...validCasebook,
      permissionReference: '',
    }).success).toBe(false);
    expect(casebookInputSchema.safeParse({
      ...validCasebook,
      rightsConfirmed: false,
    }).success).toBe(false);
    expect(casebookInputSchema.safeParse({
      ...validCasebook,
      attributionConfirmed: false,
    }).success).toBe(false);
  });
});
