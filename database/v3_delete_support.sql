-- ============================================================
-- Fassicana v3 - Full Schema Reference & Migration Script
-- ============================================================
-- Compatible with: Supabase / PostgreSQL 14+
-- Safe to run multiple times (uses IF NOT EXISTS / IF NOT EXISTS guards)
-- NOTE: "user" is a reserved word in PostgreSQL — always quoted as "user"
-- ============================================================

-- ============================================================
-- SECTION 1: CREATE TABLES (fresh install)
-- ============================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS "user" (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(255) UNIQUE NOT NULL,
    email           VARCHAR(255),
    mobile_no       VARCHAR(20),
    google_id       VARCHAR(255),
    profile_pic     TEXT,
    bio             TEXT,
    is_verified_business BOOLEAN DEFAULT FALSE,
    profile_views   INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Design / Post Table
CREATE TABLE IF NOT EXISTS "userdesign" (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    image_url       TEXT NOT NULL,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    is_ready_to_sell BOOLEAN DEFAULT FALSE,
    price           DOUBLE PRECISION DEFAULT 0.0,
    likes           INTEGER DEFAULT 0,
    category        VARCHAR(255) DEFAULT 'Couture',
    creator_id      INTEGER NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Follow / Social Graph Table
CREATE TABLE IF NOT EXISTS "follow" (
    id                  SERIAL PRIMARY KEY,
    follower_username   VARCHAR(255) NOT NULL,
    followed_username   VARCHAR(255) NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_follow_follower ON "follow" (follower_username);
CREATE INDEX IF NOT EXISTS ix_follow_followed ON "follow" (followed_username);

-- 4. Comment / Feedback Table
CREATE TABLE IF NOT EXISTS "comment" (
    id          SERIAL PRIMARY KEY,
    design_id   INTEGER NOT NULL REFERENCES "userdesign" (id) ON DELETE CASCADE,
    username    VARCHAR(255) NOT NULL,
    text        TEXT NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_comment_design ON "comment" (design_id);

-- 5. Product / Wholesale Inventory Table
CREATE TABLE IF NOT EXISTS "product" (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    image_url   TEXT,
    price       DOUBLE PRECISION DEFAULT 0.0,
    stock_count INTEGER DEFAULT 0,
    category    VARCHAR(255)
);


-- ============================================================
-- SECTION 2: INCREMENTAL MIGRATIONS
-- Run only if upgrading an existing (older) database.
-- Each uses IF NOT EXISTS so it is safe to re-run.
-- ============================================================

-- Add profile_views column (v2 migration)
ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;

-- Add selling columns (v2 migration)
ALTER TABLE "userdesign"
    ADD COLUMN IF NOT EXISTS is_ready_to_sell BOOLEAN DEFAULT FALSE;

ALTER TABLE "userdesign"
    ADD COLUMN IF NOT EXISTS price DOUBLE PRECISION DEFAULT 0.0;

-- Add category column (v2 migration)
ALTER TABLE "userdesign"
    ADD COLUMN IF NOT EXISTS category VARCHAR(255) DEFAULT 'Couture';


-- ============================================================
-- SECTION 3: DELETE SUPPORT (v3)
-- ============================================================
-- No schema changes required for delete support.
-- The backend DELETE /designs/{design_id}?requester_id={id} endpoint:
--   1. Validates that requester_id == design.creator_id
--   2. Deletes all "comment" rows WHERE design_id = X
--      (also handled automatically via ON DELETE CASCADE above)
--   3. Deletes the "userdesign" row
-- ============================================================
