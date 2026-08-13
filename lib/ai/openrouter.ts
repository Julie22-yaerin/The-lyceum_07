const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
// Defaults to a free-tier model — paid models 402 on an account with no
// purchased credits (verified live). Override via OPENROUTER_MODEL once
// billing is set up.
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b:free";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompleteOptions {
  messages: ChatMessage[];
  model?: string;
  jsonMode?: boolean;
}

function getApiKeys(): string[] {
  return [
    process.env.OPENROUTER_API_KEY_1,
    process.env.OPENROUTER_API_KEY_2,
    process.env.OPENROUTER_API_KEY_3,
  ].filter((key): key is string => Boolean(key));
}

/**
 * Chat completion via OpenRouter, rotating across up to 3 configured keys.
 * A key that's rate-limited or rejected is skipped in favor of the next one.
 */
export async function chatComplete({ messages, model, jsonMode }: ChatCompleteOptions): Promise<string> {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error("No OpenRouter API keys configured");
  }

  let lastError: unknown;

  for (const apiKey of keys) {
    try {
      const response = await fetch(OPENROUTER_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model ?? DEFAULT_MODEL,
          messages,
          ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        }),
      });

      if (response.status === 401 || response.status === 403 || response.status === 429) {
        lastError = new Error(`OpenRouter key rejected (${response.status})`);
        continue;
      }

      if (!response.ok) {
        lastError = new Error(`OpenRouter request failed (${response.status})`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        lastError = new Error("OpenRouter response missing message content");
        continue;
      }
      return content;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("All OpenRouter keys failed");
}
