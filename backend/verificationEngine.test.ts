import { describe, expect, it } from 'vitest';
import { VerificationEngine } from './verificationEngine.js';

describe('solution validation', () => {
  it('accepts a short structured solution and computes its word count', async () => {
    const result = await VerificationEngine.validateLayer1Gate({
      contentJson: { framing: 'Start with the bottleneck.' },
    });

    expect(result).toEqual({
      compliant: true,
      contentJson: { framing: 'Start with the bottleneck.' },
      wordCount: 4,
    });
  });

  it('rejects empty or blank solution sections', async () => {
    await expect(VerificationEngine.validateLayer1Gate({ contentJson: {} })).resolves.toMatchObject({
      compliant: false,
    });
    await expect(VerificationEngine.validateLayer1Gate({ contentJson: { framing: '  ' } })).resolves.toMatchObject({
      compliant: false,
    });
  });

  it('rejects solutions over the word limit', async () => {
    const result = await VerificationEngine.validateLayer1Gate({
      contentJson: { framing: 'word '.repeat(4001) },
    });

    expect(result).toMatchObject({ compliant: false, error: 'Solution must be 4,000 words or fewer.' });
  });

  it('accepts a complete Guesstimate without automatically scoring it', async () => {
    const result = await VerificationEngine.validateLayer1Gate({
      caseType: 'Guesstimate',
      contentJson: {
        clarify_scope: 'Estimate annual demand for the defined market.',
        structure_segments: JSON.stringify(['Segment one', 'Segment two']),
        assumptions: JSON.stringify([
          { name: 'Population', value: '1000', unit: 'people', rationale: 'Census estimate' },
          { name: 'Share', value: '0.2', unit: 'fraction', rationale: 'Survey estimate' },
          { name: 'Frequency', value: '4', unit: 'per year', rationale: 'Usage data' },
        ]),
        calculation_steps: '1000 × 0.2 × 4 = 800.',
        sanity_check: 'Compare against last year’s observed volume.',
        final_estimate: JSON.stringify({ value: '800', unit: 'units/year', low: '600', high: '1000' }),
      },
    });

    expect(result.compliant).toBe(true);
    if (result.compliant) expect(result).not.toHaveProperty('score');
  });

  it('requires three numeric, unit-bearing and reasoned assumptions', async () => {
    const contentJson = {
      clarify_scope: 'Scope.',
      structure_segments: JSON.stringify(['Segment']),
      assumptions: JSON.stringify([
        { name: 'Population', value: 'many', unit: 'people', rationale: 'A reason' },
        { name: 'Share', value: '0.2', unit: 'fraction', rationale: 'A reason' },
      ]),
      calculation_steps: 'Calculation.',
      sanity_check: 'Sanity check.',
      final_estimate: JSON.stringify({ value: '10', unit: 'items', low: '5', high: '20' }),
    };

    await expect(VerificationEngine.validateLayer1Gate({ caseType: 'Guesstimate', contentJson })).resolves.toMatchObject({
      compliant: false,
      error: 'Add at least three assumptions with a numeric value, unit, and rationale.',
    });

    const invalidAssumptions = {
      ...contentJson,
      assumptions: JSON.stringify([
        { name: 'A', value: 'Infinity', unit: 'x', rationale: 'Reason' },
        { name: 'B', value: '2', unit: '', rationale: 'Reason' },
        { name: 'C', value: '3', unit: 'x', rationale: '' },
      ]),
    };
    await expect(VerificationEngine.validateLayer1Gate({
      caseType: 'Guesstimate',
      contentJson: invalidAssumptions,
    })).resolves.toMatchObject({ compliant: false });
  });

  it('requires a numeric final estimate and a valid low-to-high range', async () => {
    const contentJson = {
      clarify_scope: 'Scope.',
      structure_segments: JSON.stringify(['Segment']),
      assumptions: JSON.stringify([
        { name: 'A', value: '1', unit: 'x', rationale: 'Reason' },
        { name: 'B', value: '2', unit: 'x', rationale: 'Reason' },
        { name: 'C', value: '3', unit: 'x', rationale: 'Reason' },
      ]),
      calculation_steps: 'Calculation.',
      sanity_check: 'Sanity check.',
      final_estimate: JSON.stringify({ value: '10', unit: 'items', low: '12', high: '20' }),
    };

    await expect(VerificationEngine.validateLayer1Gate({ caseType: 'Guesstimate', contentJson })).resolves.toMatchObject({
      compliant: false,
      error: 'Final estimate must satisfy low ≤ value ≤ high.',
    });
  });

  it('rejects nonnumeric final estimate values and missing units', async () => {
    const contentJson = {
      clarify_scope: 'Scope.',
      structure_segments: JSON.stringify(['Segment']),
      assumptions: JSON.stringify([
        { name: 'A', value: '1', unit: 'x', rationale: 'Reason' },
        { name: 'B', value: '2', unit: 'x', rationale: 'Reason' },
        { name: 'C', value: '3', unit: 'x', rationale: 'Reason' },
      ]),
      calculation_steps: 'Calculation.',
      sanity_check: 'Sanity check.',
      final_estimate: JSON.stringify({ value: 'ten', unit: '', low: '5', high: '20' }),
    };
    await expect(VerificationEngine.validateLayer1Gate({ caseType: 'Guesstimate', contentJson })).resolves.toMatchObject({
      compliant: false,
      error: 'Enter numeric estimate and range values with a unit.',
    });
  });

  it('uses a separate human-review weight profile for Guesstimates', () => {
    expect(VerificationEngine.calculateIndividualWeightedScore({
      structure: 5,
      assumption_quality: 4,
      math_accuracy: 3,
      sanity_check: 2,
      clarity: 1,
    })).toBeCloseTo(3);
    expect(VerificationEngine.calculateIndividualWeightedScore({
      problem_framing: 1,
      framework_fit: 2,
      data_integrity: 3,
      insight_depth: 4,
      feasibility: 5,
    })).toBeCloseTo(2.75);
  });
});
