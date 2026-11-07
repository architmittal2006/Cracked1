import { describe, expect, it } from 'vitest';
import { caseContentSchema } from './contentValidation.js';

const validCase = {
  title: 'Profitability turnaround for a retail chain',
  type: 'Profitability',
  sector: 'Retail',
  difficulty: 'Standard',
  description: 'A regional grocery chain has seen margins compress over three consecutive quarters.',
  deliverables: ['Issue tree', 'Root-cause analysis', 'Recommendation'],
  referenceRange: null,
  referenceSolution: 'Margin decline is driven by shrink and private-label mix; renegotiate supply terms and fix shrink processes first.',
  rubricCriteria: [
    { name: 'Structure', description: 'Uses a MECE issue tree covering revenue and cost drivers.' },
  ],
  contentOwner: 'Cracked content team',
  authorCredit: 'Case authored by the Cracked team',
  sourceKind: 'original',
  sourceReference: null,
  rightsDeclaration: 'Original work created for Cracked; all rights reserved by the platform.',
  rightsConfirmed: true,
};

const validGuesstimate = {
  ...validCase,
  title: 'How many cups of coffee are sold in Chicago daily?',
  type: 'Guesstimate',
  referenceRange: { value: 1500000, unit: 'cups per day', low: 900000, high: 2500000 },
};

describe('caseContentSchema', () => {
  it('accepts a complete case payload', () => {
    expect(caseContentSchema.safeParse(validCase).success).toBe(true);
  });

  it('accepts a guesstimate with a reference range', () => {
    expect(caseContentSchema.safeParse(validGuesstimate).success).toBe(true);
  });

  it('accepts a guesstimate without a reference range', () => {
    const result = caseContentSchema.safeParse({
      ...validGuesstimate,
      referenceRange: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a reference range on non-guesstimate content', () => {
    const result = caseContentSchema.safeParse({
      ...validCase,
      referenceRange: { value: 10, unit: 'stores', low: 5, high: 20 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a reference range where low > value or value > high', () => {
    expect(caseContentSchema.safeParse({
      ...validGuesstimate,
      referenceRange: { value: 100, unit: 'cups', low: 200, high: 300 },
    }).success).toBe(false);
    expect(caseContentSchema.safeParse({
      ...validGuesstimate,
      referenceRange: { value: 400, unit: 'cups', low: 200, high: 300 },
    }).success).toBe(false);
  });

  it('requires explicit rights confirmation', () => {
    expect(caseContentSchema.safeParse({ ...validCase, rightsConfirmed: false }).success).toBe(false);
    const { rightsConfirmed: _omitted, ...withoutConfirmation } = validCase;
    expect(caseContentSchema.safeParse(withoutConfirmation).success).toBe(false);
  });

  it('requires a source reference for non-original content', () => {
    expect(caseContentSchema.safeParse({
      ...validCase,
      sourceKind: 'licensed',
      sourceReference: null,
    }).success).toBe(false);
    expect(caseContentSchema.safeParse({
      ...validCase,
      sourceKind: 'public_domain',
      sourceReference: 'Example Public Archive, case study 42',
    }).success).toBe(true);
  });

  it('rejects the legacy_unverified sentinel for new content', () => {
    // 'legacy_unverified' exists only on backfilled rows; new admin content
    // must declare a real source kind.
    expect(caseContentSchema.safeParse({ ...validCase, sourceKind: 'legacy_unverified' }).success).toBe(false);
  });

  it('accepts optional exhibits text', () => {
    expect(caseContentSchema.safeParse({ ...validCase, exhibits: 'Chart 1: margin bridge' }).success).toBe(true);
  });

  it('enforces field length and collection bounds', () => {
    expect(caseContentSchema.safeParse({ ...validCase, title: 'short' }).success).toBe(false);
    expect(caseContentSchema.safeParse({ ...validCase, deliverables: [] }).success).toBe(false);
    expect(caseContentSchema.safeParse({ ...validCase, deliverables: Array(9).fill('Deliverable item') }).success).toBe(false);
    expect(caseContentSchema.safeParse({ ...validCase, difficulty: 'Impossible' }).success).toBe(false);
    expect(caseContentSchema.safeParse({ ...validCase, type: 'Brain Teaser' }).success).toBe(false);
  });
});
