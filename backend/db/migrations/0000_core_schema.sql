CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'General',
  credibility_score INTEGER NOT NULL DEFAULT 0,
  solve_score INTEGER NOT NULL DEFAULT 0,
  review_score INTEGER NOT NULL DEFAULT 0,
  cases_solved INTEGER NOT NULL DEFAULT 0,
  merge_bonus_count INTEGER NOT NULL DEFAULT 0,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR(255) PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions (expire);

CREATE TABLE IF NOT EXISTS cases (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  sector VARCHAR(100) NOT NULL,
  difficulty VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Open',
  description TEXT NOT NULL,
  deliverables TEXT[] NOT NULL DEFAULT '{}',
  pts INTEGER NOT NULL DEFAULT 0,
  submission_count INTEGER NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  deadline TIMESTAMPTZ,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_chaos BOOLEAN DEFAULT FALSE,
  timer_deadline TIMESTAMPTZ,
  reference_range JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS reference_range JSONB;

CREATE TABLE IF NOT EXISTS case_proposals (
  id VARCHAR(255) PRIMARY KEY,
  contributor_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  sector VARCHAR(100) NOT NULL,
  difficulty VARCHAR(50) NOT NULL,
  source_kind VARCHAR(50) NOT NULL,
  source_reference TEXT,
  context TEXT NOT NULL,
  prompt TEXT NOT NULL,
  exhibits TEXT,
  deliverables TEXT[] NOT NULL DEFAULT '{}',
  reviewer_guide TEXT NOT NULL,
  solution_outline TEXT NOT NULL,
  reference_range JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  moderator_notes TEXT,
  reviewed_by VARCHAR(255),
  published_case_id VARCHAR(255) REFERENCES cases(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);
ALTER TABLE case_proposals ADD COLUMN IF NOT EXISTS reference_range JSONB;
CREATE INDEX IF NOT EXISTS case_proposals_contributor_created_idx
  ON case_proposals (contributor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS case_proposals_status_created_idx
  ON case_proposals (status, created_at ASC);

CREATE TABLE IF NOT EXISTS casebooks (
  id VARCHAR(255) PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  source_org VARCHAR(255) NOT NULL,
  source_kind VARCHAR(50) NOT NULL,
  year INTEGER,
  description TEXT NOT NULL,
  license_kind VARCHAR(50) NOT NULL,
  permission_reference TEXT,
  external_url TEXT,
  industries TEXT[] NOT NULL DEFAULT '{}',
  case_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  uploader_id VARCHAR(255) NOT NULL REFERENCES users(id),
  moderator_notes TEXT,
  reviewed_by VARCHAR(255) REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS casebooks_status_created_idx
  ON casebooks (status, created_at DESC);
CREATE INDEX IF NOT EXISTS casebooks_uploader_created_idx
  ON casebooks (uploader_id, created_at DESC);

CREATE TABLE IF NOT EXISTS casebook_cases (
  id VARCHAR(255) PRIMARY KEY,
  casebook_id VARCHAR(255) NOT NULL REFERENCES casebooks(id) ON DELETE CASCADE,
  slug VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  firm VARCHAR(255),
  sector VARCHAR(100) NOT NULL,
  case_type VARCHAR(100),
  difficulty VARCHAR(50) NOT NULL,
  summary TEXT NOT NULL,
  body TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  practice_case_id VARCHAR(255) REFERENCES cases(id) ON DELETE SET NULL,
  UNIQUE (casebook_id, slug)
);
CREATE INDEX IF NOT EXISTS casebook_cases_book_position_idx
  ON casebook_cases (casebook_id, position);

CREATE TABLE IF NOT EXISTS takedown_requests (
  id VARCHAR(255) PRIMARY KEY,
  casebook_id VARCHAR(255) NOT NULL REFERENCES casebooks(id) ON DELETE CASCADE,
  requester_email VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submissions (
  id VARCHAR(255) PRIMARY KEY,
  case_id VARCHAR(255) NOT NULL REFERENCES cases(id),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  content_json JSONB NOT NULL,
  citations_count INTEGER NOT NULL DEFAULT 0,
  word_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
  structural_compliant BOOLEAN DEFAULT FALSE,
  final_weighted_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(255) PRIMARY KEY,
  submission_id VARCHAR(255) NOT NULL REFERENCES submissions(id),
  reviewer_id VARCHAR(255) NOT NULL REFERENCES users(id),
  case_id VARCHAR(255) REFERENCES cases(id),
  reviewer_tier VARCHAR(50) NOT NULL,
  scores JSONB NOT NULL,
  is_voided BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  feedback TEXT NOT NULL DEFAULT ''
);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS feedback TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS votes (
  id VARCHAR(255) PRIMARY KEY,
  submission_id VARCHAR(255) NOT NULL REFERENCES submissions(id),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  direction VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credibility_scores (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
