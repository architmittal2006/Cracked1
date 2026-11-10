CREATE TABLE IF NOT EXISTS case_versions (
  id VARCHAR(255) PRIMARY KEY,
  case_id VARCHAR(255) NOT NULL REFERENCES cases(id),
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  status VARCHAR(20) NOT NULL CHECK (status IN ('Draft', 'Published')),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  sector VARCHAR(100) NOT NULL,
  difficulty VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  exhibits TEXT,
  deliverables TEXT[] NOT NULL DEFAULT '{}',
  reference_range JSONB,
  reference_solution TEXT NOT NULL,
  rubric_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  content_owner VARCHAR(255) NOT NULL,
  author_credit VARCHAR(255),
  source_kind VARCHAR(50) NOT NULL CHECK (source_kind IN (
    'original', 'licensed', 'public_domain', 'permission_granted', 'legacy_unverified'
  )),
  source_reference TEXT,
  rights_declaration TEXT NOT NULL,
  rights_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  published_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  CHECK ((status = 'Published') = (published_at IS NOT NULL)),
  UNIQUE (case_id, version_number)
);

CREATE UNIQUE INDEX IF NOT EXISTS case_versions_one_draft_idx
  ON case_versions (case_id) WHERE status = 'Draft';
CREATE INDEX IF NOT EXISTS case_versions_history_idx
  ON case_versions (case_id, version_number DESC);

-- Backfill every existing case as its initial published version. Legacy rows
-- carry no recorded solution, rubric, owner or rights data, so they are marked
-- with explicit 'legacy_unverified' sentinels instead of fabricated content.
INSERT INTO case_versions (
  id, case_id, version_number, status, title, type, sector, difficulty,
  description, exhibits, deliverables, reference_range, reference_solution,
  rubric_criteria, content_owner, author_credit, source_kind, source_reference,
  rights_declaration, rights_verified, created_at, published_at
)
SELECT
  'legacy_case_version_' || md5(c.id), c.id, 1, 'Published', c.title, c.type,
  c.sector, c.difficulty, c.description, NULL, c.deliverables, c.reference_range,
  'Legacy content: reference solution was not recorded during import.',
  '[]'::jsonb, 'Unverified — legacy import', NULL, 'legacy_unverified', NULL,
  'Legacy content; source and distribution rights require verification.',
  FALSE, c.created_at, c.created_at
FROM cases c
WHERE NOT EXISTS (
  SELECT 1 FROM case_versions v WHERE v.case_id = c.id
);

-- cases stays the stable identity and published projection; the pointer makes
-- the currently published version explicit and is updated atomically with the
-- projection when content is published or unpublished.
ALTER TABLE cases ADD COLUMN IF NOT EXISTS current_version_id VARCHAR(255);

UPDATE cases c
SET current_version_id = v.id
FROM case_versions v
WHERE v.case_id = c.id
  AND v.version_number = 1
  AND v.status = 'Published'
  AND c.current_version_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cases_current_version_fk'
  ) THEN
    ALTER TABLE cases
      ADD CONSTRAINT cases_current_version_fk
      FOREIGN KEY (current_version_id) REFERENCES case_versions(id);
  END IF;
END $$;

-- Published versions are immutable snapshots: they cannot be updated or
-- deleted. Drafts remain editable and deletable, and a draft may transition to
-- Published exactly once (after which it becomes immutable).
CREATE OR REPLACE FUNCTION case_versions_block_published_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'Published' THEN
      RAISE EXCEPTION 'Published case versions are immutable and cannot be modified or deleted'
        USING ERRCODE = 'raise_exception';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.status = 'Published' THEN
    -- Content snapshots are immutable. The only permitted change is clearing
    -- actor attribution (created_by/published_by) via ON DELETE SET NULL when
    -- a user account is removed; every other column must stay identical.
    IF (to_jsonb(NEW) - 'created_by' - 'published_by')
         IS DISTINCT FROM (to_jsonb(OLD) - 'created_by' - 'published_by')
       OR (NEW.created_by IS NOT NULL AND NEW.created_by IS DISTINCT FROM OLD.created_by)
       OR (NEW.published_by IS NOT NULL AND NEW.published_by IS DISTINCT FROM OLD.published_by)
    THEN
      RAISE EXCEPTION 'Published case versions are immutable and cannot be modified or deleted'
        USING ERRCODE = 'raise_exception';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS case_versions_immutable_when_published ON case_versions;
CREATE TRIGGER case_versions_immutable_when_published
  BEFORE UPDATE OR DELETE ON case_versions
  FOR EACH ROW EXECUTE FUNCTION case_versions_block_published_mutation();

-- The published pointer must reference a Published version of the same case,
-- so drafts can never leak into the public projection and unpublished content
-- keeps its history without a live pointer.
CREATE OR REPLACE FUNCTION cases_current_version_is_valid()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  version_status VARCHAR(20);
  version_case_id VARCHAR(255);
BEGIN
  IF NEW.current_version_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT status, case_id INTO version_status, version_case_id
  FROM case_versions
  WHERE id = NEW.current_version_id;
  IF version_status IS DISTINCT FROM 'Published' OR version_case_id IS DISTINCT FROM NEW.id THEN
    RAISE EXCEPTION 'cases.current_version_id must reference a Published version of the same case'
      USING ERRCODE = 'raise_exception';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cases_current_version_is_valid ON cases;
CREATE TRIGGER cases_current_version_is_valid
  BEFORE INSERT OR UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION cases_current_version_is_valid();
