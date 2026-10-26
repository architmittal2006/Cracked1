export interface GuesstimateReferenceRange {
  value: number;
  unit: string;
  low: number;
  high: number;
}

export function parseGuesstimateEstimateValue(serializedEstimate: string): number | undefined {
  const parsed: unknown = JSON.parse(serializedEstimate);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;

  const value = (parsed as Record<string, unknown>).value;
  const numericValue = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim()
      ? Number(value)
      : Number.NaN;

  return Number.isFinite(numericValue) ? numericValue : undefined;
}

export function isEstimateFarOutsideReferenceRange(
  estimate: number,
  range: GuesstimateReferenceRange
): boolean {
  return (range.low > 0 && estimate < range.low / 2) || estimate > range.high * 2;
}
