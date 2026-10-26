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
});
