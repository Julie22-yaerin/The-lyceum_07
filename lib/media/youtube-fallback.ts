import { chatComplete } from "@/lib/ai/openrouter";
import { getCachedTopicQuery, setCachedTopicQuery } from "@/lib/media/cache";

// Free-tier OpenRouter models can be "reasoning" models that spend several
// seconds generating hidden chain-of-thought before answering even a
// trivial classification (measured up to ~23s for this exact prompt) — far
// too slow to block a video load on. The raw topic id is already a decent
// search phrase on its own, so the AI call is raced against a short
// timeout: whichever finishes first wins the actual request, and if the AI
// loses the race it's left running in the background purely to populate
// the topic-query cache for next time (see getCachedTopicQuery below).
const AI_QUERY_TIMEOUT_MS = 2500;

function rawTopicQuery(topic: string): string {
  return topic.replace(/-/g, " ");
}

async function fetchAiQuery(topic: string): Promise<string | null> {
  try {
    const content = await chatComplete({
      jsonMode: true,
      messages: [
        {
          role: "system",
          content:
            "Turn a study topic id into a short YouTube search phrase (3-6 words) " +
            "likely to surface a good short explainer video on that exact topic. " +
            'Reply with strict JSON only: {"query": string}.',
        },
        { role: "user", content: `Topic: ${topic}` },
      ],
    });
    const parsed = JSON.parse(content) as { query?: string };
    return parsed.query?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Picks a YouTube search phrase for `topic`. Cached per topic (not per
 * video), so a real AI-picked query only ever needs to win the race once
 * for a given topic globally — every subsequent call (any video, any user)
 * gets it back instantly, even across many broken source URLs that share it.
 */
async function pickSearchQuery(topic: string): Promise<string> {
  const cached = await getCachedTopicQuery(topic);
  if (cached) return cached;

  const aiPromise = fetchAiQuery(topic).then((query) => {
    if (query) void setCachedTopicQuery(topic, query);
    return query;
  });

  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), AI_QUERY_TIMEOUT_MS));
  const winner = await Promise.race([aiPromise, timeout]);
  return winner ?? rawTopicQuery(topic);
}

/**
 * Scrapes a YouTube Shorts video id for the given search query out of the
 * search-results page's embedded JSON (no official API key configured for
 * this project, so this is a best-effort HTML scrape, not a stable API
 * contract). Returns null on any failure.
 */
async function findYouTubeShortId(query: string): Promise<string | null> {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${query} shorts`
  )}&sp=EgQQAQ%253D%253D`;

  let response: Response;
  try {
    response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
      next: { revalidate: 21600 }, // Cache 6 hours
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;

  const html = await response.text();
  const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
  return match ? match[1] : null;
}

/**
 * AI picks a search query for `topic`, then finds a same-topic YouTube
 * Short and returns a native embed URL for it — used as the fallback for
 * TikTok/Instagram links that don't resolve to a real playable video.
 * Never throws — returns null on any failure so the caller can fall back
 * further (e.g. to the platform's own oEmbed widget).
 */
export async function resolveTopicYouTubeShort(topic: string): Promise<string | null> {
  const query = await pickSearchQuery(topic);
  const videoId = await findYouTubeShortId(query);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&controls=0&mute=0&loop=1&playlist=${videoId}&modestbranding=1&rel=0`;
}
