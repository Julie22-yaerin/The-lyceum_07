-- AlgoScroll Engine v6.0 — Initial schema
-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Topics
CREATE TABLE topics (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Videos Catalog (Optimized for Microlink)
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id VARCHAR(50) REFERENCES topics(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('educational', 'entertainment')),
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'instagram', 'twitter')),
    original_url TEXT NOT NULL UNIQUE,
    direct_mp4_url TEXT,                 -- Extracted by Microlink
    thumbnail_url TEXT,
    creator_handle VARCHAR(100),
    duration_seconds FLOAT,
    fetch_provider VARCHAR(20) DEFAULT 'microlink',
    url_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_videos_topic_id ON videos(topic_id);
CREATE INDEX idx_videos_content_type ON videos(content_type);

-- 3. Friendships & Streaks
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id_1 UUID NOT NULL,
    user_id_2 UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'blocked')),
    streak_count INT DEFAULT 0,
    last_streak_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_friendship UNIQUE (user_id_1, user_id_2)
);

CREATE INDEX idx_friendships_user_id_1 ON friendships(user_id_1);
CREATE INDEX idx_friendships_user_id_2 ON friendships(user_id_2);

-- 4. Chat & Video Sharing
CREATE TABLE direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_direct_messages_receiver_id ON direct_messages(receiver_id);
CREATE INDEX idx_direct_messages_sender_id ON direct_messages(sender_id);
