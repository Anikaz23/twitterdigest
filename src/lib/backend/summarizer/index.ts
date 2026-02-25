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
Keep the total JSON response under 1800 tokens so it is never cut off.
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
Write a digest for these tweets.
Return JSON with keys: title, summary, topics.
Title must be one line. Summary must cover every single tweet — do not skip or omit any tweet.
You may group similar tweets together in the same paragraph, but all tweets must be represented.
Include key information word for word and do not miss anything.
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
    "2000";
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
      throw new Error("Unable to summarize: no summarizer API key configured.");
    }

    return extractJson(text);
  } catch (error: any) {
    throw new Error(error?.message || "Unable to summarize.");
  }
}
