-- Phase 8.2A: record Terms of Service acceptance per user.
-- Additive and nullable: existing users have NULL until they accept the
-- current terms version via the consent gate.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS terms_version varchar(20),
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_acknowledged_at timestamptz;
