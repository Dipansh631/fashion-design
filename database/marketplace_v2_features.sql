-- Task: Database Schema Migrations for Social Features & Custom Categories (DDL)
-- Description: Adds follower systems, commentary tables, custom category classification, and profile view counter.

-- 1. Add profile_views column to "user" table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;

-- 2. Add category column to "userdesign" table
ALTER TABLE "userdesign" ADD COLUMN IF NOT EXISTS category VARCHAR(255) DEFAULT 'Couture';

-- 3. Create follow table for designer networks
CREATE TABLE IF NOT EXISTS "follow" (
    id SERIAL PRIMARY KEY,
    follower_username VARCHAR(255) NOT NULL,
    followed_username VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_follow_follower_username ON "follow" (follower_username);
CREATE INDEX IF NOT EXISTS ix_follow_followed_username ON "follow" (followed_username);

-- 4. Create comment table for design feedback
CREATE TABLE IF NOT EXISTS "comment" (
    id SERIAL PRIMARY KEY,
    design_id INTEGER NOT NULL,
    username VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (design_id) REFERENCES "userdesign" (id) ON DELETE CASCADE
);
