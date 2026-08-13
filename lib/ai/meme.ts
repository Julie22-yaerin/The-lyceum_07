import { chatComplete } from "./openrouter";

const MEME_SUBREDDITS = [
  "mathmemes",
  "physicsmemes",
  "chemistrymemes",
  "ScienceMemes",
  "EngineeringMemes",
  "ProgrammerHumor",
  "schoolmemes",
] as const;

export interface MemeResult {
  imageUrl: string;
  title: string;
  subreddit: string;
  sourceUrl: string;
}

interface MemeApiPost {
  title: string;
  url: string;
  postLink: string;
  subreddit: string;
  nsfw: boolean;
  spoiler: boolean;
}

interface MemeApiResponse {
  memes?: MemeApiPost[];
}

async function pickSubreddit(topic: string): Promise<string> {
  try {
    const content = await chatComplete({
      jsonMode: true,
      messages: [
        {
          role: "system",
          content:
            `Pick the single best-matching subreddit for a study topic, from exactly this list: ${MEME_SUBREDDITS.join(", ")}. ` +
            'Reply with strict JSON only: {"subreddit": string}. The value must be exactly one of the listed options.',
        },
        { role: "user", content: `Topic: ${topic}` },
      ],
    });
    const parsed = JSON.parse(content) as { subreddit?: string };
    if (parsed.subreddit && (MEME_SUBREDDITS as readonly string[]).includes(parsed.subreddit)) {
      return parsed.subreddit;
    }
  } catch {
    // AI unavailable or returned junk — fall through to a safe default below.
  }
  return MEME_SUBREDDITS[0];
}

/**
 * AI picks the subreddit most relevant to `topic`; meme-api.com (free,
 * no key) returns real posts from it. Never throws — returns null on any
 * failure so the caller can show a graceful empty state.
 */
export async function fetchTopicMeme(topic: string): Promise<MemeResult | null> {
  const subreddit = await pickSubreddit(topic);

  let response: Response;
  try {
    response = await fetch(`https://meme-api.com/gimme/${subreddit}/5`, {
      next: { revalidate: 3600 },
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;

  let data: MemeApiResponse;
  try {
    data = (await response.json()) as MemeApiResponse;
  } catch {
    return null;
  }

  const safe = data.memes?.find((post) => !post.nsfw && !post.spoiler);
  if (!safe) return null;

  return {
    imageUrl: safe.url,
    title: safe.title,
    subreddit: safe.subreddit,
    sourceUrl: safe.postLink,
  };
}
