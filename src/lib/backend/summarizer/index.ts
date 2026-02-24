import { summarizeWithAnthropic } from "./anthropic";
import { summarizeWithOpenAI } from "./openai";
import type { TwitterTweet } from "@/lib/backend/twitter/client";
import type { SummarizerProvider } from "@/lib/types";

const SYSTEM_PROMPT = `
Return JSON only.
Keys: "title", "summary", "topics".
"title" is one line.
"summary" is a detailed digest with appropriate length, covering all important new information.
Use multiple paragraphs and preserve concrete details from tweets.
`.trim();

export interface DigestSummary {
  title: string;
  summary: string;
  topics: string[];
}

function extractJson(text: string): DigestSummary {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON payload found in summarizer response.");
  }

  const parsed = JSON.parse(text.slice(start, end + 1)) as {
    title?: unknown;
    summary?: unknown;
    topics?: unknown;
  };

  if (typeof parsed.title !== "string" || !parsed.title.trim()) {
    throw new Error("Summarizer response missing title.");
  }

  if (typeof parsed.summary !== "string" || !parsed.summary.trim()) {
    throw new Error("Summarizer response missing summary.");
  }

  const topics = Array.isArray(parsed.topics)
    ? parsed.topics.map((topic) => String(topic)).filter(Boolean)
    : [];

  return {
    title: parsed.title.trim(),
    summary: parsed.summary.trim(),
    topics,
  };
}

function fallbackSummary(tweets: TwitterTweet[]): DigestSummary {
  const lines = tweets
    .slice(0, 24)
    .map((tweet) => `${tweet.authorHandle}: ${tweet.text}`.replace(/\s+/g, " ").trim());
  const title = tweets[0]?.authorHandle
    ? `${tweets[0].authorHandle} and others posted new updates`
    : "New tweet updates";
  const paragraphs: string[] = [];
  for (let i = 0; i < lines.length; i += 4) {
    paragraphs.push(lines.slice(i, i + 4).join(" "));
  }

  return {
    title,
    summary: paragraphs.length ? paragraphs.join("\n\n") : "No new tweets to summarize.",
    topics: ["Updates"],
  };
}

function buildPrompt(input: {
  tweets: TwitterTweet[];
  previousSummary?: string | null;
  fetchedCount: number;
  newCount: number;
}) {
  const payload = input.tweets.map((tweet) => ({
    id: tweet.id,
    author: tweet.authorHandle,
    text: tweet.text,
    url: tweet.url,
    timestamp: tweet.timestamp,
  }));

  return `
Write a digest for these new tweets.
Return JSON with keys: title, summary, topics.
Title must be one line. Summary must keep all important details and use appropriate length.
Make the summary reasonably detailed and avoid ultra-short output.
Focus only on new information.
Tweets: ${JSON.stringify(payload)}
`.trim();
}

export async function summarizeTweets(input: {
  tweets: TwitterTweet[];
  previousSummary?: string | null;
  fetchedCount: number;
  newCount: number;
  provider?: SummarizerProvider;
  openaiApiKey?: string;
  anthropicApiKey?: string;
}): Promise<DigestSummary> {
  if (!input.tweets.length) {
    return { title: "No new updates", summary: "No new tweets to summarize.", topics: [] };
  }

  const maxTokensRaw =
    process.env.SUMMARY_MAX_TOKENS ||
    process.env.OPENAI_MAX_TOKENS ||
    process.env.ANTHROPIC_MAX_TOKENS ||
    "700";
  const maxTokens = Number.isFinite(Number(maxTokensRaw)) ? Number(maxTokensRaw) : 700;

  const provider = (input.provider || process.env.SUMMARIZER_PROVIDER || "auto").toLowerCase();
  const openaiApiKey = input.openaiApiKey || process.env.OPENAI_API_KEY || "";
  const anthropicApiKey = input.anthropicApiKey || process.env.ANTHROPIC_API_KEY || "";
  const userPrompt = buildPrompt(input);

  try {
    let text: string;
    if (provider === "anthropic") {
      text = await summarizeWithAnthropic({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        maxTokens,
        temperature: 0.2,
        apiKey: anthropicApiKey || undefined,
      });
    } else if (provider === "openai") {
      text = await summarizeWithOpenAI({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        maxTokens,
        temperature: 0.2,
        apiKey: openaiApiKey || undefined,
      });
    } else if (openaiApiKey) {
      text = await summarizeWithOpenAI({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        maxTokens,
        temperature: 0.2,
        apiKey: openaiApiKey,
      });
    } else if (anthropicApiKey) {
      text = await summarizeWithAnthropic({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        maxTokens,
        temperature: 0.2,
        apiKey: anthropicApiKey,
      });
    } else {
      return fallbackSummary(input.tweets);
    }

    return extractJson(text);
  } catch {
    return fallbackSummary(input.tweets);
  }
}
