# AlgoScroll Engine

**Document Type:** Final Production Technical Architecture & API Specification
**Primary Integration:** Microlink API (Real-time Extraction & Hydration)
**Tech Stack:** Next.js 14+ (App Router), Tailwind CSS, Supabase, Microlink SDK

---

## 1. Microlink Fetching Protocol (Kiến trúc Fetching v6.0)

Hệ thống loại bỏ hoàn toàn yt-dlp local và chuyển sang gọi Microlink API Endpoint để lấy Direct Video Stream (.mp4) và Metadata chỉ với 1 HTTP Request.

```
                    ┌─────────────────────────────────────────┐
                    │      Client Requests Video Feed         │
                    └────────────────────┬────────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   │   Supabase Cache (videos.direct_mp4)      │
                   └──────┬───────────────────────────┬────────┘
             HIT (95%)    │                           │ MISS (5%)
                          ▼                           ▼
            ┌───────────────────┐           ┌───────────────────┐
            │ Return Stream URL │           │  Microlink Engine │
            └───────────────────┘           └─────────┬─────────┘
                                                      │
         ┌────────────────────────────────────────────┼────────────────────────────────────────────┐
         │ (Mode 1: YouTube Shorts)                   │ (Mode 2: TikTok / IG / X)                  │ (Mode 3: Fallback)
         ▼                                            ▼                                            ▼
┌─────────────────┐                          ┌──────────────────┐                         ┌──────────────────┐
│ Native Direct   │                          │ Microlink CDN    │                         │ Microlink iframe │
│ iFrame Embed    │                          │ Direct MP4 Url   │                         │ Embed Code       │
└─────────────────┘                          └──────────────────┘                         └──────────────────┘
```

### 1.1 Chi tiết Kỹ thuật Fetching qua Microlink API

When a user pastes or requests a social media video link, your server hits Microlink's endpoint:

```
https://api.microlink.io?url={TARGET_URL}&video=true
```

Endpoint Payload Response từ Microlink:

```json
{
  "status": "success",
  "data": {
    "title": "Math Trick for Derivatives",
    "description": "Learn fast calculus tricks #igcse",
    "publisher": "TikTok",
    "image": {
      "url": "https://m.media-amazon.com/images/..."
    },
    "video": {
      "url": "https://v16-webapp-prime.tiktok.com/video/tos/...",
      "duration": 34.2,
      "type": "mp4"
    },
    "author": "@math_genius"
  }
}
```

---

## 2. Updated Database Schema (v6.0)

```sql
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
```

---

## 3. Server-Side Resolver Implementation (`app/api/v1/media/resolve/route.ts`)

```ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { original_url, platform } = await req.json();

    // 1. YouTube Shorts Strategy (Direct Native Embed)
    if (platform === 'youtube') {
      const videoIdMatch = original_url.match(/(?:shorts\/|v=)([^"&?/\s]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      if (videoId) {
        return NextResponse.json({
          success: true,
          player_type: 'iframe',
          embed_url: `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&controls=0&mute=0&loop=1&playlist=${videoId}&modestbranding=1&rel=0`
        });
      }
    }

    // 2. TikTok / Instagram / X Strategy (Microlink API)
    const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(original_url)}&video=true`;
    const response = await fetch(microlinkUrl, {
      headers: { 'User-Agent': 'AlgoScroll/6.0' },
      next: { revalidate: 43200 } // Cache 12 hours
    });

    const result = await response.json();

    if (result.status === 'success' && result.data?.video?.url) {
      return NextResponse.json({
        success: true,
        player_type: 'direct_mp4',
        stream_url: result.data.video.url,
        thumbnail: result.data.image?.url || '',
        duration: result.data.video.duration || 0,
        creator: result.data.author || result.data.publisher || '@creator'
      });
    }

    // 3. Fallback Mode if direct stream extraction fails
    return NextResponse.json({
      success: true,
      player_type: 'iframe_fallback',
      iframe_html: result.data?.iframe?.html || null,
      original_url
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Microlink Extraction Failed' },
      { status: 500 }
    );
  }
}
```

---

## 4. Cursor / Claude Code System Prompt (Dán trực tiếp để code)

Copy đoạn prompt dưới đây và dán thẳng vào Cursor AI để triển khai bản v6.0 hoàn chỉnh:

```
You are an elite Senior Full-Stack Engineer building "AlgoScroll" PRD v6.0 using Next.js 14+ (App Router), Tailwind CSS, Supabase, and the Microlink API.

---

### 1. CORE MISSION
Implement the Production Media Engine using Microlink API for video extraction. Convert raw video links from TikTok, Instagram, X, and YouTube Shorts into zero-lag, instant-playing slides with an interleaved feed (3 Edu Videos : 1 Meme Video : 1 Active Recall Quiz Card).

---

### 2. ARCHITECTURE & COMPONENTS TO IMPLEMENT

#### A. Backend API Endpoint: `app/api/v1/media/resolve/route.ts`
- Implement a POST route accepting `{ original_url: string, platform: string }`.
- For YouTube: Parse video ID and return clean iFrame embed link.
- For TikTok / IG / X: Query Microlink API (`https://api.microlink.io?url={url}&video=true`). Extract `data.video.url` for direct HTML5 MP4 playback.
- Return structured JSON response matching PRD v6.0 specs.

#### B. Universal Player Component: `components/player/UniversalPlayer.tsx`
- Support 3 rendering modes:
  1. `iframe` (YouTube Shorts with postMessage JS API control)
  2. `direct_mp4` (HTML5 `<video>` element with `playsInline`, `loop`, muted control)
  3. `iframe_fallback` (Microlink HTML embed fallback)
- Handle loading states, play/pause state synchronization based on active slide visibility.

#### C. Interleaved Feed Container: `components/feed/FeedScroll.tsx`
- Build a vertical snap-scrolling feed (`snap-y snap-mandatory h-screen overflow-y-scroll`).
- Inject an interactive **Active Recall Quiz Card** component after every 4th video item.
- Virtualize DOM rendering to hold only 3 slides active at a time (previous, current, next) to prevent browser memory crashes.

#### D. Social & Friend Streak Bar: `components/social/StreakBar.tsx`
- Top floating overlay displaying current Friend Streak count (🔥).
- Quick "Share Video to Friend" drawer button.

---

### 3. CODE QUALITY & EFFICIENCY REQUIREMENTS
- Strict TypeScript types.
- Zero extra dependencies—use native `fetch()` and Tailwind CSS.
- Optimize mobile gesture responsiveness (`touch-action: pan-y`).
```

---

## Implementation Status

| # | Item | Status |
|---|------|--------|
| A | `app/api/v1/media/resolve/route.ts` | ✅ Implemented |
| B | `components/player/UniversalPlayer.tsx` | ✅ Implemented |
| C | `components/feed/FeedScroll.tsx` | ✅ Implemented |
| D | `components/social/StreakBar.tsx` | ⏳ Pending |
