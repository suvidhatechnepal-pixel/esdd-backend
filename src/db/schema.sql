-- ESDD Risk Console - schema
-- Run once via: npm run migrate

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('admin', 'assessor', 'reviewer')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  must_reset_password BOOLEAN NOT NULL DEFAULT true, -- forces password change on first login
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Single row holding the current checklist config (questions/options/exclude flags),
-- stored as JSON so it stays admin-editable without a schema migration every time
-- a question changes. History is kept so nothing is silently lost when edited.
CREATE TABLE IF NOT EXISTS checklist_versions (
  id              SERIAL PRIMARY KEY,
  checklist       JSONB NOT NULL,
  is_current      BOOLEAN NOT NULL DEFAULT false,
  created_by      INTEGER REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Only one version may be "current" at a time (enforced in application code on write).

CREATE TABLE IF NOT EXISTS assessments (
  id                  SERIAL PRIMARY KEY,
  checklist_version_id INTEGER NOT NULL REFERENCES checklist_versions(id),
  created_by          INTEGER NOT NULL REFERENCES users(id), -- the assessor who owns this record
  client               TEXT NOT NULL,
  transaction_id        TEXT,
  location              TEXT,
  sector                TEXT,
  product               TEXT,
  officer               TEXT,
  business_line         TEXT,
  loan_category         TEXT,
  assessment_date       DATE,
  answers               JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { "1.1": {"option":"a","comment":"..."}, ... }
  summary               JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Annex 7 fields
  -- Escalation / review workflow (Step 6 of the Guideline: Medium/High must escalate)
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

-- Simple audit trail - who did what, useful for a regulated workflow like this
CREATE TABLE IF NOT EXISTS audit_log (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id),
  action        TEXT NOT NULL,       -- e.g. 'assessment.create', 'user.deactivate'
  entity_type   TEXT,
  entity_id     INTEGER,
  details       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
