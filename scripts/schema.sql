-- ============================================================
-- AUTHBLOCK — Complete Database Schema
-- Run this on your fresh NeonDB PostgreSQL instance
-- ============================================================

-- ── 1. ENUM TYPES ────────────────────────────────────────────

CREATE TYPE admin_type_enum AS ENUM ('admin', 'superadmin');


-- ── 2. ADMIN TABLE ───────────────────────────────────────────

CREATE TABLE admin (
  id                 SERIAL PRIMARY KEY,
  name               TEXT NOT NULL,
  email              TEXT UNIQUE NOT NULL,
  phone              TEXT,
  position           TEXT,
  admin_type         admin_type_enum NOT NULL DEFAULT 'admin',
  firebase_uid       TEXT,
  firebase_email     TEXT,
  firebase_photo_url TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── 3. USERS TABLE (Students) ────────────────────────────────

CREATE TABLE users (
  id             SERIAL PRIMARY KEY,
  prn_no         TEXT UNIQUE NOT NULL,
  full_name      TEXT NOT NULL,
  student_email  TEXT,
  qr_token       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_qr_token ON users(qr_token);


-- ── 4. MARKSHEETS TABLE ──────────────────────────────────────

CREATE TABLE marksheets (
  id                SERIAL PRIMARY KEY,
  serial_no         TEXT,
  student_name      TEXT NOT NULL,
  prn_no            TEXT NOT NULL,
  examination       TEXT,
  branch            TEXT,
  session_name      TEXT,
  sgpi              TEXT,
  cgpi              TEXT,
  remarks           TEXT,
  subjects          JSONB,

  -- Storage
  supabase_pdf_url  TEXT,

  -- Admin who issued
  issued_by         INTEGER REFERENCES admin(id) ON DELETE SET NULL,

  -- Dual Hash System (Blockchain)
  pdf_hash          TEXT,
  data_hash         TEXT,
  tx_hash_pdf       TEXT,
  tx_hash_data      TEXT,

  -- Certificate metadata
  certificate_id    TEXT UNIQUE,
  certificate_url   TEXT,
  verification_url  TEXT,
  certificate_data  JSONB,

  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_marksheets_prn ON marksheets(prn_no);
CREATE INDEX idx_marksheets_cert_id ON marksheets(certificate_id);
CREATE INDEX idx_marksheets_data_hash ON marksheets(data_hash);
CREATE INDEX idx_marksheets_pdf_hash ON marksheets(pdf_hash);


-- ── 5. DEGREES TABLE (Final Degree Certificates) ─────────────

CREATE TABLE degrees (
  id                SERIAL PRIMARY KEY,
  serial_no         TEXT,
  student_name      TEXT NOT NULL,
  prn_no            TEXT NOT NULL,
  branch            TEXT,
  degree_title      TEXT NOT NULL,
  enrollment_year   TEXT,
  year_of_passing   TEXT,
  final_cgpi        TEXT,
  classification    TEXT,
  convocation_date  TEXT,

  -- Storage
  pdf_url           TEXT,

  -- Admin who issued
  issued_by         INTEGER REFERENCES admin(id) ON DELETE SET NULL,

  -- Dual Hash System (Blockchain)
  pdf_hash          TEXT,
  data_hash         TEXT,
  tx_hash_pdf       TEXT,
  tx_hash_data      TEXT,

  -- Certificate metadata
  certificate_id    TEXT UNIQUE,
  verification_url  TEXT,
  certificate_data  JSONB,

  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_degrees_prn ON degrees(prn_no);
CREATE INDEX idx_degrees_cert_id ON degrees(certificate_id);
CREATE INDEX idx_degrees_data_hash ON degrees(data_hash);
CREATE INDEX idx_degrees_pdf_hash ON degrees(pdf_hash);


-- ── 6. COURSES TABLE (Short-term / Workshop Certificates) ────

CREATE TABLE courses (
  id                SERIAL PRIMARY KEY,
  student_name      TEXT NOT NULL,
  prn_no            TEXT NOT NULL,
  course_name       TEXT NOT NULL,
  course_type       TEXT,                -- 'workshop', 'certification', 'online_course', 'seminar'
  duration          TEXT,                -- e.g. '40 hours', '3 days', '6 weeks'
  instructor_name   TEXT,
  start_date        TEXT,
  end_date          TEXT,
  grade             TEXT,                -- e.g. 'A+', 'Pass', 'Distinction'
  description       TEXT,

  -- Storage
  pdf_url           TEXT,

  -- Admin who issued
  issued_by         INTEGER REFERENCES admin(id) ON DELETE SET NULL,

  -- Dual Hash System (Blockchain)
  pdf_hash          TEXT,
  data_hash         TEXT,
  tx_hash_pdf       TEXT,
  tx_hash_data      TEXT,

  -- Certificate metadata
  certificate_id    TEXT UNIQUE,
  verification_url  TEXT,
  certificate_data  JSONB,

  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_prn ON courses(prn_no);
CREATE INDEX idx_courses_cert_id ON courses(certificate_id);
CREATE INDEX idx_courses_data_hash ON courses(data_hash);
CREATE INDEX idx_courses_pdf_hash ON courses(pdf_hash);


-- ── 7. QR SCANS TABLE ────────────────────────────────────────

CREATE TABLE qr_scans (
  id             SERIAL PRIMARY KEY,
  prn_no         TEXT NOT NULL,
  scanned_by_ip  TEXT,
  tx_hash        TEXT,
  scanned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qr_scans_prn ON qr_scans(prn_no);


-- ── 8. SEED: Admin users ─────────────────────────────────────────
-- Safe to re-run (ON CONFLICT DO NOTHING)

INSERT INTO admin (name, email, admin_type)
VALUES 
  ('Ashley Almeida', 'ashleyalmeida182006@gmail.com', 'superadmin'),
  ('Ashley Almeida (College)', 'crce.10246.ceb@gmail.com', 'superadmin')
ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- DONE — All tables created!
-- Tables: admin, users, marksheets, degrees, courses, qr_scans
-- ============================================================
