-- Phase 8.2B: peer-review consensus produces fractional weighted scores
-- (verificationEngine.calculateIndividualWeightedScore returns 0-5 floats),
-- so the persisted final score must be floating point rather than integer.
-- Additive type widening: existing integer values convert losslessly.
-- Reversal (manual): ALTER TABLE submissions
--   ALTER COLUMN final_weighted_score TYPE integer USING ROUND(final_weighted_score);
ALTER TABLE submissions
  ALTER COLUMN final_weighted_score TYPE double precision;
