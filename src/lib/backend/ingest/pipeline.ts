import {
  getDigestByIdempotencyKey,
  getExistingTweetIds,
  saveDigest,
  saveDigestTweetLinks,
  upsertTweets,
} from "@/lib/backend/db/repository";
import type { DigestStatus } from "@/lib/types";
import type { TwitterTweet } from "@/lib/backend/twitter/client";

export interface TweetBatchAnalysis {
  fetchedTweets: TwitterTweet[];
  uniqueTweets: TwitterTweet[];
  newTweets: TwitterTweet[];
  seenTweets: TwitterTweet[];
  newTweetIds: Set<string>;
}

function dedupeById(tweets: TwitterTweet[]): TwitterTweet[] {
  const seen = new Set<string>();
  const unique: TwitterTweet[] = [];
  for (const tweet of tweets) {
    if (!tweet.id || seen.has(tweet.id)) continue;
    seen.add(tweet.id);
    unique.push(tweet);
  }
  return unique;
}

export async function analyzeTweetBatch(tweets: TwitterTweet[]): Promise<TweetBatchAnalysis> {
  const uniqueTweets = dedupeById(tweets);
  const existingIds = await getExistingTweetIds(uniqueTweets.map((tweet) => tweet.id));
  const newTweets = uniqueTweets.filter((tweet) => !existingIds.has(tweet.id));
  const seenTweets = uniqueTweets.filter((tweet) => existingIds.has(tweet.id));

  return {
    fetchedTweets: tweets,
    uniqueTweets,
    newTweets,
    seenTweets,
    newTweetIds: new Set(newTweets.map((tweet) => tweet.id)),
  };
}

export async function persistDigestFromBatch(params: {
  batch: TweetBatchAnalysis;
  summary: string;
  topics?: string[] | null;
  status?: DigestStatus;
  source?: string | null;
  idempotencyKey?: string | null;
  workerRunId?: string | null;
  metadata?: Record<string, unknown> | null;
  latestTweetId?: string | null;
}): Promise<{ digestId: number; duplicate: boolean; counts: { fetched: number; unique: number; new: number; seen: number } }> {
  if (params.idempotencyKey) {
    const existing = await getDigestByIdempotencyKey(params.idempotencyKey);
    if (existing) {
      return {
        digestId: existing.id,
        duplicate: true,
        counts: {
          fetched: 0,
          unique: 0,
          new: 0,
          seen: 0,
        },
      };
    }
  }

  await upsertTweets(params.batch.uniqueTweets);

  const digestId = await saveDigest({
    summary: params.summary,
    topics: params.topics ?? null,
    status: params.status ?? "completed",
    source: params.source ?? null,
    idempotencyKey: params.idempotencyKey ?? null,
    workerRunId: params.workerRunId ?? null,
    latestTweetId: params.latestTweetId ?? null,
    metadata: {
      fetchedCount: params.batch.fetchedTweets.length,
      uniqueCount: params.batch.uniqueTweets.length,
      newCount: params.batch.newTweets.length,
      seenCount: params.batch.seenTweets.length,
      ...(params.metadata ?? {}),
    },
  });

  await saveDigestTweetLinks({
    digestId,
    allTweets: params.batch.uniqueTweets,
    newTweetIds: params.batch.newTweetIds,
  });

  return {
    digestId,
    duplicate: false,
    counts: {
      fetched: params.batch.fetchedTweets.length,
      unique: params.batch.uniqueTweets.length,
      new: params.batch.newTweets.length,
      seen: params.batch.seenTweets.length,
    },
  };
}
