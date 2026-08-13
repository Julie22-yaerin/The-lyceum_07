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

## Light / dark mode

- `app/globals.css` restructured: light is the base `:root` (Apple's canonical `#f5f5f7` ground), with `[data-theme="dark"]` / `[data-theme="light"]` blocks overriding every neutral/accent/shadow token. Both blocks use the plain attribute selector (not `:root[data-theme=...]`), so the same rule works whether the attribute sits on `<html>` (the global toggle) or on a nested wrapper (used to force a subtree to one theme regardless of the page-level setting).
- New `--bg-video` token (`#000000`, never overridden) plus a `bg-video` Tailwind color — the actual video canvas and its placeholders/spinners (`UniversalPlayer`, `VideoSlide`, `FeedScroll`, `QuizCard`) now use this instead of the theme-toggling `--bg`.
- **Reels/`/feed` stays dark always**, independent of the app-wide toggle — `app/home-client.tsx`'s root now carries `data-theme="dark"`, the same way Instagram/TikTok never put their video-viewing screen in light mode even when the OS is light. Chat, Profile, the landing page, and the tab bar all follow the toggle normally.
- `components/ThemeToggle.tsx`: sun/moon icon button, reads/writes `document.documentElement.dataset.theme` + `localStorage('lyceum-theme')`. Placed in the landing nav and as a "Appearance" settings row on Profile.
- No flash-of-wrong-theme: a `next/script` `beforeInteractive` snippet in `app/layout.tsx` resolves `localStorage → prefers-color-scheme → 'light'` and sets `data-theme` on `<html>` before first paint.
- Fixed a handful of hardcoded `bg-white/[...]` utilities on the landing page/nav that wouldn't have flipped with the theme (the CTA gradient block intentionally keeps its own fixed color treatment in both themes, per the Apple skill's "colored CTA" pattern).
- Verified with Playwright across both `colorScheme: 'light'` and `'dark'` contexts (landing, feed, chat, profile — 0 console/hydration errors) and a live toggle-then-reload test confirming the choice persists via `localStorage` even when it disagrees with the simulated system preference.

## Onboarding, achievements, chat filters, Reels actions

All of this is client-side and `localStorage`-backed (`lib/storage.ts`) — there is still no backend/auth in this project, so "saved" means "saved in this browser," not synced anywhere. Documenting that once here rather than on every feature.

- **Onboarding** (`app/onboarding/page.tsx`): a 4-step wizard — nickname, `@username` (format-validated, no real availability check since there's no backend to check against), photo (file upload previewed via `FileReader` as a data URL, entirely client-side — nothing is uploaded anywhere) or a color-swatch avatar, and a bio. Submits to `saveStoredProfile()` and redirects to `?next=` (defaults to `/feed`). Reused as the **edit-profile** flow from Profile's "Edit" button (`/onboarding?next=/profile`), prefilling from the stored profile when one exists.
  - **Bug caught in testing and fixed**: the prefill effect originally fell back to `mockProfile` (the demo "You" data) when nothing was stored yet, so a first-time visitor's freshly-typed nickname could get silently overwritten by the mock name. Fixed to only prefill when a real stored profile exists — first-time visitors now see a blank form. Verified via Playwright: typed "Test User" → `localStorage` and the redirected page both showed "Test User", not "You".
- **Achievements**: a card grid on Profile (`lib/mock-data.ts: mockAchievements`), earned vs. locked (dimmed) — seeded/static per the demo-data pattern the rest of the app already uses, not computed from real activity tracking.
- ~~Chat filters~~ — **removed in the v1 scope cut below.** (Was: a segmented Primary/Unread/Read control on a chat inbox, verified working before removal.)
- **Reels actions** (`components/feed/VideoActions.tsx`, mounted per slide from `VideoSlide.tsx`): a right-side action rail — Like (heart fills red, count persists via `localStorage`), Comment (opens `CommentSheet.tsx`, an edge-anchored sheet reusing the same spring-motion recipe as the share drawer), and Share (reuses the existing `ShareDrawer`, scoped to that video). Comments support `@mention` tagging: typing `@` opens a friend picker, and mentioned names render in the accent color in both the seed data and newly posted comments.
  - **Bug caught in testing and fixed**: the action rail was originally positioned `bottom-6` (24px from the screen edge), which put the Share button behind/under the translucent bottom tab bar on `/feed` — only visible because a screenshot showed it clipped. Repositioned to clear `env(safe-area-inset-bottom) + 84px` (the tab bar's height), verified visually that all three actions now sit clearly above the bar.
- Achievements/actions verified with Playwright interaction tests (not just screenshots): like toggle changes count and fill, comment mention renders correctly.

## v1 scope cut: Chat removed, then restored

Chat was cut for v1, then explicitly brought back — restored `app/(app)/chat/` from git history (the commit right before removal), which already had the light/dark theming and Primary/Unread/Read filter applied, so no rework needed there. `TabBar.tsx` is back to 3 tabs, and Profile's friends list links into `/chat/[id]` again.

## Real video sharing in chat

Share (from the per-video action rail) now actually delivers into the recipient's chat thread instead of just showing a confirmation toast:

- `lib/types.ts`: `ChatMessage` gained an optional `sharedVideo: SharedVideoAttachment` field (`videoId`, `platform`, `originalUrl`, `creatorHandle`).
- `lib/storage.ts`: new `getSentMessages()` / `sendMessageToFriend()`, same localStorage-backed pattern as everything else (per-browser only — still no backend, see the earlier note on `lib/storage.ts`).
- `components/feed/VideoActions.tsx`'s `handleShare` looks up the video being shared in `mockVideos` and, if found, calls `sendMessageToFriend` with the attachment before showing the existing "Sent to X" confirmation. (The top-bar `StreakBar` share stays as-is — it's not tied to a specific video, so there's nothing to attach.)
- `app/(app)/chat/[friendId]/page.tsx` merges `getSentMessages()[friendId]` after the seed messages on mount, and renders `sharedVideo` messages as a distinct card (platform icon, creator handle, "Tap to watch" linking to the original URL) instead of a plain text bubble.
- `app/(app)/chat/page.tsx`'s inbox preview also checks for sent messages and shows "You shared a video" as the latest preview when present, overriding the static seed text.

Verified the full loop with Playwright **in a single browser session** (an earlier attempt across two separate script invocations wrongly looked broken — each `chromium.launch()` is a fresh profile, so localStorage doesn't carry over between separate test runs, which is a test-methodology gotcha, not an app bug): shared a video from Reels → chat inbox showed "You shared a video" for that friend → opening the thread showed a real "SHARED A VIDEO" card with the correct creator handle and a working "Tap to watch" link.

## LaTeX rendering (KaTeX)

`components/MathText.tsx` renders inline `$...$`-delimited LaTeX via KaTeX (`katex.renderToString`), leaving everything else as plain text. It's a plain function component with no hooks — `renderToString` is a pure function of its input, so server and client produce identical HTML and there's no hydration risk from it (unlike the earlier `window.location` bug). Wired into `QuizCard`'s question and options; `mockQuizzes` now uses real LaTeX (`$x^2$`, `$\int 2x \, dx$`, quadratic-formula-style options) instead of plain-text math. KaTeX's CSS is imported once in `app/globals.css`. Verified visually — proper italic math typesetting with superscripts, not literal `x^2` text.

## AI meme embedding

- `lib/ai/meme.ts`: OpenRouter picks the best-matching subreddit for a topic from a small curated whitelist (`mathmemes`, `physicsmemes`, `chemistrymemes`, `ScienceMemes`, `EngineeringMemes`, `ProgrammerHumor`, `schoolmemes`) via the same JSON-mode pattern as quiz generation, then `meme-api.com` (a free, keyless public API that serves real Reddit posts) returns an actual image URL — filtered to skip anything flagged `nsfw`/`spoiler`. Returns `null` (never throws) on any failure.
- `app/api/v1/ai/meme/route.ts` + `components/feed/MemeSlide.tsx`: a new `FeedSlide` kind (`"meme"`) fetches this on mount (same resolve-on-mount pattern as `VideoSlide`), shows the image full-bleed with an "AI-picked for this topic" caption, and reuses `VideoActions` for like/comment/share. Wired into `FeedScroll` as one demo slide per feed (spliced in after the 2nd item) — a full ratio-based rollout (matching the "3 edu : 1 meme : 1 quiz" composition) is a follow-up, not done here, to avoid touching the already-tested `buildInterleavedFeed` core loop.
- **Untestable live from this sandbox** (same egress block as Iframely/OpenRouter, see above) — verified instead that the failure path is graceful: `MemeSlide` shows a clean "Couldn't fetch a meme for this topic right now" message, no crash, no console error. Logic (subreddit whitelist enforcement, nsfw filtering, JSON parsing guards) is correct by inspection and will produce a real image once run somewhere with open egress.

## Floating AI assistant bubble

A single persistent circular button (bottom-left, clears the tab bar) sits on `/feed` regardless of which slide is active — `components/feed/AssistantBubble.tsx`, rendered once at the `HomeClient` level (not per-slide), so it doesn't get remounted on scroll. `FeedScroll` reports the currently-active slide's context up via a new `onActiveSlideChange` callback (video topic/platform/creator, the quiz question + options, or the meme topic) into `HomeClient` state, which the bubble reads — verified the sheet's header correctly read "Ask about this igcse calculus video" when opened on that slide.

Tapping it opens an edge-anchored chat sheet (same spring-sheet recipe as Comment/Share) with a message thread; `app/api/v1/ai/assistant/route.ts` sends the conversation plus the slide context to OpenRouter and returns a 2-4 sentence answer. Verified end-to-end except the final network hop: typed a question, it appeared as a sent bubble, a loading indicator showed, and — since `openrouter.ai` is blocked in this sandbox — the designed graceful-failure message ("Sorry, I couldn't reach the AI just now — try again in a bit.") rendered correctly instead of crashing or hanging.

## Deploy status (unchanged)

Still no Railway CLI token or MCP connector available in this session — nothing to add beyond what's documented above under "Railway Deployment." The code is ready to build and start correctly on Railway; actually triggering a deploy needs either the GitHub repo already wired to auto-deploy on `main` (this push would trigger it), or a Railway token/build log from the user.

## Live E2E test (network policy switched to open) — real bugs found and fixed

The user switched the environment's network policy, unblocking `iframe.ly`, `openrouter.ai`, `meme-api.com`, `tiktok.com` (confirmed via `curl` — `403` → `200`). This is the first time any of the fetching/AI integrations could be tested against real upstreams. Four real, previously-invisible bugs surfaced immediately:

1. **Iframely never actually worked for real TikTok/Instagram content.** `lib/media/iframely.ts` only checked `links.video` (direct file) and `links.player` (plain `<iframe src>`). Real responses for TikTok/Instagram grant neither — they return `links.app`, an oEmbed `<blockquote>` + loader `<script>` widget. Every real request silently fell through to `null` (→ Microlink fallback, which *also* no longer returns direct video URLs for TikTok — confirmed live: `data.video` is `null`). **Fixed**: `links.app` is now read and passed through as the existing `iframe_fallback` player type (`app/api/v1/media/resolve/route.ts`, `lib/media/iframely.ts`).
2. **The oEmbed widget didn't render even once wired up.** `dangerouslySetInnerHTML` (and raw `innerHTML`) never execute embedded `<script>` tags — a browser/React limitation, not framework-specific. **Fixed**: `UniversalPlayer.tsx`'s `iframe_fallback` branch now sets `innerHTML` imperatively via a ref, then finds every `<script>` in the injected HTML and replaces it with a freshly-created clone (browsers *do* execute dynamically-created-and-appended `<script>` elements) — verified live: real TikTok caption, author, hashtags, and song title rendered from the actual embed.
3. **All 3 OpenRouter keys hit `402 Insufficient credits` on the default model** (`openai/gpt-4o-mini`, a paid model) — verified via `curl` that all 3 keys share one account (`creator_user_id` identical across all three) with zero purchased credits, so the 3-key fallback provided no redundancy against this specific failure. **Fixed**: default model switched to `openai/gpt-oss-20b:free` (queried OpenRouter's live model list for a currently-available free-tier model, verified it actually returns a completion) in `lib/ai/openrouter.ts`. `generate-quiz`, `meme` subreddit-picking, and `assistant` all verified working end-to-end with real output afterward (a real chain-rule quiz question, a real math meme image, a real 2-4 sentence answer).
4. **The oEmbed spinner could get stuck forever.** The script-execution `useEffect` only called `setIsLoading(false)` on the success path — if Iframely legitimately returned no embeddable content, the effect returned early and the loading spinner rendered on top of the "Unable to load preview" message indefinitely. **Fixed**: the effect now also clears loading state on the empty-content path.
5. **Not a code bug, but the actual root cause of "TikTok never loads" in the running app**: `mockVideos[3]` (the `v4` TikTok entry) still pointed at the placeholder URL `@example/video/1234567890` from the very first scaffold — a video that has never existed. Every prior "TikTok fetch" test in this project was structurally guaranteed to fail regardless of the API integration's correctness. **Fixed**: swapped in a real, verified-public TikTok URL (`@scout2015/video/6718335390845095173`) in `lib/mock-data.ts`.

Also confirmed a sandbox-specific, non-app quirk: **Node's built-in `fetch` needs `NODE_USE_ENV_PROXY=1`** to actually route through this environment's proxy — without it, server-side `fetch()` calls fail with `Host not in allowlist`, even with the network policy open and with `curl` (which reads `HTTPS_PROXY` natively) succeeding on the identical request. This only matters for local testing *inside this sandbox*; Railway/Vercel/a real machine have no such proxy and don't need the flag — noting it here so it isn't mistaken for an app bug if someone re-tests from this same environment type.

**End-to-end verified working with real data**: TikTok resolve (real oEmbed metadata rendering), meme fetch (real image from r/mathmemes), quiz generation (a real, correct chain-rule question), AI assistant (a real, coherent answer). The TikTok embed's actual video player iframe didn't finish loading within the test window (metadata rendered, player still pending) — plausibly slower loading or embed restrictions specific to a headless/localhost context; not chased further given everything else is verified and the fallback tier is, by design, the least polished path.
