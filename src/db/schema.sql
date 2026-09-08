-- ESDD Risk Console - schema
-- Run once via: npm run migrate

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('admin', 'assessor', 'reviewer')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  must_reset_password BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checklist_versions (
  id              SERIAL PRIMARY KEY,
  checklist       JSONB NOT NULL,
  is_current      BOOLEAN NOT NULL DEFAULT false,
  created_by      INTEGER REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessments (
  id                    SERIAL PRIMARY KEY,
  checklist_version_id  INTEGER NOT NULL REFERENCES checklist_versions(id),
  created_by            INTEGER NOT NULL REFERENCES users(id),
  client                TEXT NOT NULL,
  transaction_id        TEXT,
  location              TEXT,
  sector                TEXT,
  product               TEXT,
  officer               TEXT,
  business_line         TEXT,
  loan_category         TEXT,
  assessment_date       DATE,
  answers               JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary               JSONB NOT NULL DEFAULT '{}'::jsonb,
  status                TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  reviewed_by           INTEGER REFERENCES users(id),
  reviewed_at           TIMESTAMPTZ,
  review_notes          TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessments_created_by ON assessments(created_by);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_client ON assessments USING gin (to_tsvector('english', client));

CREATE TABLE IF NOT EXISTS audit_log (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id),
  action        TEXT NOT NULL,
  entity_type   TEXT,
  entity_id     INTEGER,
  details       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
