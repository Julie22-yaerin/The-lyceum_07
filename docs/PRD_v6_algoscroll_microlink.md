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
| D | `components/social/StreakBar.tsx` | ✅ Implemented |
| — | `supabase/migrations/0001_init_schema.sql` | ✅ Implemented |

### Notes
- StreakBar/ShareDrawer currently run on local component state (mock friends). Wiring them to real `friendships` / `direct_messages` tables needs a configured Supabase project (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) — not available in this environment.
- Video playback testing (real TikTok/IG/X/YouTube URLs against the Microlink API) is deferred per user request.
- **Fetching provider keys (Iframely, AI API)**: placeholders added to `.env.example`; actual values to be provided by the user directly into Railway's environment variables (not pasted in chat) once integration work starts.

## Visual Design — Apple Liquid Glass (dark-grey / light-blue)

Redesigned the app chrome (not the video canvas) using the Apple Liquid Glass design system, adapted to a dark, video-first surface:

- **Palette**: pure-black video canvas (`--bg`), dark-grey elevated surfaces for sheets/panels (`--surface #1c1c1e`, `--surface-2 #2c2c2e`), one light-blue accent (`--accent #5ac8fa`) reserved for emphasis (streak flame, focus states). Correctness feedback in the quiz uses green/red (`--live` / `--danger`) since that's meaning, not decoration.
- **StreakBar**: two glass pills (`backdrop-filter: blur(20px) saturate(180%)`) floating over the feed — a Lucide flame icon (not emoji) + tabular-nums streak count, and a share action with a real share-glyph icon.
- **ShareDrawer**: rebuilt as an iOS-style edge-anchored bottom sheet (grab handle, top-rounded `--r-panel`, spring easing `cubic-bezier(0.32,0.72,0,1)`, same-path enter/exit, `prefers-reduced-motion` cross-fade fallback) instead of a plain centered modal. Friends render as one unified panel with hairline dividers, not fragmented cards.
- **QuizCard**: options are one unified panel with hairline dividers (previously separate bordered buttons — fixed to follow the "panel not cards" rule); reveal state dims non-answers and marks correct/incorrect with icon + color.
- Dropped the unused Geist local fonts in favor of the system font stack (`-apple-system, ... 'SF Pro Text' ...`) per the skill's typography rule.
- Tokens live in `app/globals.css` (`:root` custom properties) and are exposed as Tailwind utilities in `tailwind.config.ts` (`bg-surface`, `text-text-2`, `rounded-panel`, etc.) — components reference tokens, no hard-coded one-off hex/px values.

## Railway Deployment

- `railway.json` pins the Nixpacks builder with explicit `npm run build` / `npm run start`, plus an on-failure restart policy.
- `package.json` start script binds to Railway's injected port: `next start -p ${PORT:-3000}` (verified locally with `PORT=8080 npm run start`) — the most common cause of a Next.js app failing to come up on Railway is `next start` defaulting to port 3000 while Railway's health check probes `$PORT`.
- Added `engines.node >=18.18.0` so Nixpacks picks a consistent Node version.
- **Not done from this session**: actually triggering/monitoring a Railway deploy — no Railway CLI token or MCP connector is available here. If the GitHub repo is already connected to a Railway project with auto-deploy on `main`, pushing this branch should trigger a build; otherwise a Railway API token (or the real build error log) is needed to go further.

## Landing Page — "The Lyceum"

- New root route `app/page.tsx`: Apple Liquid Glass marketing page positioning **The Lyceum — the unfair advantage for laziness**. Glass sticky nav (`components/marketing/LandingNav.tsx`, scroll-edge hairline), hero, a unified "How it works" panel (3 rows, hairline-divided — not fragmented cards), an independent feature-card grid, a blue gradient CTA with light orbs (glass-on-color, still one accent hue), and a plain footer.
- The actual product feed moved from `/` to `/feed` (`app/(app)/feed/page.tsx`) so `/` is a proper landing page and `/feed` is the app.
- Verified with `tsc`/`lint`/`build` and Playwright screenshots at desktop (1280px) and mobile (390px) widths.

## Fetching providers — Iframely + OpenRouter wired in

The user provided 1 Iframely key and 3 OpenRouter keys directly in chat. **These are now considered exposed** (present in this session's conversation history) — recommend rotating them on iframe.ly and openrouter.ai once things are stable. They were written only to a local `.env` (gitignored, never committed — verified with `git check-ignore` and `git ls-files`).

- `lib/media/iframely.ts`: calls `https://iframe.ly/api/iframely?url=...&key=...`, maps `links.video` → `direct_mp4`, else `links.player` → `iframe` (most TikTok/IG/X results are an official embeddable player, not a raw file — that's still treated as a real playable result), returns `null` on any failure so the caller can fall back.
- `app/api/v1/media/resolve/route.ts`: for tiktok/instagram/twitter, tries Iframely first, then falls back to the existing Microlink call, then the iframe-embed fallback — unchanged behavior for `youtube` (native embed, no external call).
- `lib/ai/openrouter.ts`: chat-completion client that rotates across up to 3 `OPENROUTER_API_KEY_*` keys — a key rejected/rate-limited (401/403/429) is skipped in favor of the next one. Model defaults to `openai/gpt-4o-mini`, overridable via `OPENROUTER_MODEL`.
- `app/api/v1/ai/generate-quiz/route.ts`: first concrete AI feature — POST `{topic_id, title, description}` → an Active Recall `QuizCardData` generated via OpenRouter (JSON-mode prompt, shape-validated before returning). Video auto-tagging and a study-assistant chatbot (also requested) are **not built yet** — scoped out to avoid shipping three half-finished AI features; this one is complete end-to-end.

### Live test results (this sandbox)
`iframe.ly`, `api.microlink.io`, and `openrouter.ai` are all **blocked by this session's egress proxy** (`CONNECT tunnel failed, response 403` — confirmed via direct `curl`, independent of the app). This is an organization network policy for this sandbox, not a bug in the integration:
- `POST /api/v1/media/resolve` with a YouTube URL → succeeds (no external call needed).
- `POST /api/v1/media/resolve` with a TikTok URL → `{"success":false,"error":"Media Extraction Failed"}` (Iframely and Microlink both unreachable here).
- `POST /api/v1/ai/generate-quiz` → `{"success":false,"error":"OpenRouter key rejected (403)"}` after trying all 3 keys in order (confirms the fallback loop itself works).

Real video fetch / AI generation needs to be tested somewhere with open egress — e.g. the deployed Railway instance, or the user's own machine.

**Update**: re-tested again via a second, independent tool (WebFetch, which runs outside this session's local Bash proxy) — still `EGRESS_BLOCKED` for `iframe.ly`. This confirms the block is a network policy on the **environment** itself (set when the Claude Code on the web environment was created), not something fixable from inside a session. To actually fetch live video, switch the environment's network policy to allow general internet access (environment settings), then re-run — or test against the deployed Railway instance / a local machine, neither of which sits behind this policy.

## IG-style app shell — Reels / Chat / Profile + invite links

Restructured the product into three tab-barred sections, Instagram-style:

- `components/nav/TabBar.tsx`: fixed glass bottom tab bar (Reels / Chat / Profile), one accent active tab, real line icons — hidden on an open chat thread (`/chat/[id]`) since that view has its own message-input bar, matching how IG hides its tab bar in a DM thread.
- Routes moved under a shared `app/(app)/layout.tsx` route group so all three tabs render inside the same shell: `/feed` (existing reels), `/chat` (new), `/profile` (new). URLs are unchanged by the route group.
- **Chat** (`app/(app)/chat/page.tsx` + `/chat/[friendId]/page.tsx`): inbox is one unified panel (avatar, name, streak, last-message preview, hairline dividers — not per-row cards); thread view has real message bubbles and a working send box (local component state — not persisted anywhere yet, no backend chat storage exists).
- **Profile** (`app/(app)/profile/page.tsx`): avatar/handle header, a 3-column stats panel (Friends / Best streak / Reels watched), an **Invite a friend** panel, and a friends list that deep-links into `/chat/[id]`.
- **Invite link** (`app/invite/[code]/page.tsx`): the actual destination the copied link points to — a standalone landing page with the 40%-off pitch and a "Claim & open the feed" CTA. The link itself and the copy-to-clipboard button are fully real (verified with Playwright: `navigator.clipboard.readText()` returned the correct `origin/invite/<code>` URL after clicking Copy).

### What's real vs. what's still UI-only
The invite flow's **copy-able link and its landing page are functional**. The **40% discount and "unlock each other's fetched reels" entitlement are not implemented** — there is no auth/user-account system, billing/payment provider, or per-user video-access model anywhere in this project yet, so there's nothing for those to hook into. Building that for real needs product decisions this session doesn't have answers to: which auth provider, which payment processor, and what "their fetched reels" means as a data model (a per-user `videos` visibility flag? a shared pool keyed by referral pair?). Flagging this explicitly rather than faking a working discount.
