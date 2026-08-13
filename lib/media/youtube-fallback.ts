import { chatComplete } from "@/lib/ai/openrouter";

/**
 * AI turns a topic id (e.g. "igcse-calculus") into a short, natural
 * YouTube search phrase. Never throws — falls back to the raw topic on
 * any AI failure, which still works fine as a search query.
 */
async function pickSearchQuery(topic: string): Promise<string> {
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
    if (parsed.query && parsed.query.trim().length > 0) return parsed.query.trim();
  } catch {
    // AI unavailable or returned junk — the raw topic id is still a
    // reasonable search query on its own.
  }
  return topic.replace(/-/g, " ");
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
