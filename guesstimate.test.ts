import { describe, expect, it } from 'vitest';
import { isEstimateFarOutsideReferenceRange, parseGuesstimateEstimateValue } from './guesstimate.js';

describe('Guesstimate reference range hint', () => {
  const range = { value: 100, unit: 'units', low: 80, high: 120 };

  it('parses estimate values stored as numeric strings', () => {
    expect(parseGuesstimateEstimateValue('{"value":"241","unit":"units/year"}')).toBe(241);
    expect(parseGuesstimateEstimateValue('{"value":39}')).toBe(39);
    expect(parseGuesstimateEstimateValue('{"value":"not a number"}')).toBeUndefined();
  });

  it('flags estimates more than two times beyond the reference range', () => {
    expect(isEstimateFarOutsideReferenceRange(39, range)).toBe(true);
    expect(isEstimateFarOutsideReferenceRange(241, range)).toBe(true);
  });

  it('does not flag estimates within or near the reference range', () => {
    expect(isEstimateFarOutsideReferenceRange(40, range)).toBe(false);
    expect(isEstimateFarOutsideReferenceRange(240, range)).toBe(false);
    expect(isEstimateFarOutsideReferenceRange(100, range)).toBe(false);
  });
});
