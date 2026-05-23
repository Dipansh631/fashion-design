-- Task: Database Schema Initialization (DDL)
-- Description: Creates the user, userdesign, and product tables matching the SQLModel declarations exactly.

-- 1. Create User table
CREATE TABLE IF NOT EXISTS "user" (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    mobile_no VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE,
    google_id VARCHAR(255) UNIQUE,
    bio TEXT DEFAULT '',
    profile_pic TEXT,
    is_verified_business BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_user_username ON "user" (username);

-- 2. Create UserDesign table
CREATE TABLE IF NOT EXISTS "userdesign" (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    likes INTEGER DEFAULT 0,
    creator_id INTEGER NOT NULL,
    is_ready_to_sell BOOLEAN DEFAULT FALSE,
    price DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES "user" (id) ON DELETE CASCADE
);

-- 3. Create Product table
CREATE TABLE IF NOT EXISTS "product" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    image_url TEXT NOT NULL,
    is_trending BOOLEAN DEFAULT FALSE,
    stock_count INTEGER DEFAULT 0,
    category VARCHAR(255) NOT NULL
);

-- 4. Enable Row Level Security (RLS) with proper double-quoting for PG reserved keywords
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "userdesign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product" ENABLE ROW LEVEL SECURITY;
