import { getLatestDigest, getSettings } from "@/lib/backend/db/repository";
import { analyzeTweetBatch, persistDigestFromBatch } from "@/lib/backend/ingest/pipeline";
import { nonEmptyOrDefault, numberOrDefault, pickSetting } from "@/lib/backend/settings";
import { summarizeTweets } from "@/lib/backend/summarizer";
import { fetchTweets } from "@/lib/backend/twitter/client";
import type { IngestionMode, SummarizerProvider, TwitterMode, TwitterPullMode } from "@/lib/types";

const SETTINGS_KEYS = [
  "ingestion_mode",
  "twitter_mode",
  "twitter_pull_mode",
  "summarizer_provider",
  "openai_api_key",
  "anthropic_api_key",
  "twitter_bearer_token",
  "twitter_api_key",
  "twitter_api_secret",
  "twitter_access_token",
  "twitter_access_token_secret",
  "twitter_user_id",
  "twitter_username",
  "twitter_query",
  "twitter_max_results",
] as const;

export async function runTwitterDigestNow() {
  const settings = await getSettings([...SETTINGS_KEYS]);
  const read = (key: string, envValue?: string) => pickSetting(settings, key, envValue);

  const ingestionMode = nonEmptyOrDefault(
    read("ingestion_mode", process.env.INGESTION_MODE),
    "twitter_api"
  ) as IngestionMode;

  if (ingestionMode !== "twitter_api") {
    return {
      skipped: true,
      reason: `Ingestion mode is ${ingestionMode}; cron twitter ingest skipped.`,
    };
  }

  const twitterMode = nonEmptyOrDefault(read("twitter_mode"), "bearer_token") as TwitterMode;
  const twitterUserId = read("twitter_user_id", process.env.TWITTER_USER_ID) ?? "";
  const twitterUsername = read("twitter_username", process.env.TWITTER_USERNAME) ?? "";
  const twitterQuery = read("twitter_query", process.env.TWITTER_QUERY) ?? "";
  const twitterPullMode = (() => {
    const raw = read("twitter_pull_mode", process.env.TWITTER_PULL_MODE);
    if (raw === "home_timeline" || raw === "user_timeline" || raw === "search_query") return raw;
    if (twitterQuery.trim()) return "search_query";
    if (twitterMode === "oauth1a" && !twitterUserId.trim() && !twitterUsername.trim()) return "home_timeline";
    return "user_timeline";
  })() as TwitterPullMode;
  const summarizerProvider = nonEmptyOrDefault(
    read("summarizer_provider", process.env.SUMMARIZER_PROVIDER),
    "auto"
  ) as SummarizerProvider;
  const openaiApiKey = read("openai_api_key", process.env.OPENAI_API_KEY) ?? undefined;
  const anthropicApiKey = read("anthropic_api_key", process.env.ANTHROPIC_API_KEY) ?? undefined;

  if (twitterPullMode === "home_timeline" && twitterMode !== "oauth1a") {
    throw new Error("Home timeline mode requires Twitter OAuth 1.0a access mode.");
  }

  if (twitterPullMode === "user_timeline" && !twitterUserId.trim() && !twitterUsername.trim()) {
    throw new Error("User timeline mode requires twitter_user_id or twitter_username.");
  }

  if (twitterPullMode === "search_query" && !twitterQuery.trim()) {
    throw new Error("Search query mode requires twitter_query.");
  }

  const tweets = await fetchTweets({
    mode: twitterMode,
    pullMode: twitterPullMode,
    bearerToken: read("twitter_bearer_token", process.env.TWITTER_BEARER_TOKEN) ?? undefined,
    apiKey: read("twitter_api_key", process.env.TWITTER_API_KEY) ?? undefined,
    apiSecret: read("twitter_api_secret", process.env.TWITTER_API_SECRET) ?? undefined,
    accessToken: read("twitter_access_token", process.env.TWITTER_ACCESS_TOKEN) ?? undefined,
    accessTokenSecret:
      read("twitter_access_token_secret", process.env.TWITTER_ACCESS_TOKEN_SECRET) ?? undefined,
    userId: twitterUserId || undefined,
    username: twitterUsername || undefined,
    query: twitterQuery || undefined,
    maxResults: numberOrDefault(read("twitter_max_results", process.env.TWITTER_MAX_RESULTS), 50),
  });

  const batch = await analyzeTweetBatch(tweets);

  if (batch.newTweets.length === 0) {
    return {
      skipped: true,
      reason: "no_new_data",
      counts: {
        fetched: batch.fetchedTweets.length,
        unique: batch.uniqueTweets.length,
        new: 0,
        seen: batch.seenTweets.length,
      },
    };
  }

  const previous = await getLatestDigest();

  const summary = await summarizeTweets({
    tweets: batch.newTweets,
    previousSummary: previous?.summary ?? null,
    fetchedCount: batch.uniqueTweets.length,
    newCount: batch.newTweets.length,
    provider: summarizerProvider,
    openaiApiKey,
    anthropicApiKey,
  });

  const saved = await persistDigestFromBatch({
    batch,
    summary: summary.summary,
    topics: summary.topics,
    status: "completed",
    source: "twitter_api",
    metadata: {
      title: summary.title,
      twitterMode,
      twitterPullMode,
      summarizerProvider,
    },
  });

  return {
    skipped: false,
    digestId: saved.digestId,
    counts: saved.counts,
  };
}
