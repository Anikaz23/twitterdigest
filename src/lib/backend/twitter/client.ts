import { TwitterApi } from "twitter-api-v2";

export interface TwitterTweet {
  id: string;
  text: string;
  authorHandle: string;
  timestamp: string;
  url: string;
}

export interface TwitterConfig {
  mode: "bearer_token" | "oauth1a";
  pullMode: "home_timeline" | "user_timeline" | "search_query";
  bearerToken?: string;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  accessTokenSecret?: string;
  userId?: string;
  username?: string;
  query?: string;
  maxResults: number;
}

function buildClient(config: TwitterConfig): TwitterApi {
  if (config.mode === "oauth1a") {
    if (!config.apiKey || !config.apiSecret || !config.accessToken || !config.accessTokenSecret) {
      throw new Error(
        "OAuth mode requires twitter_api_key, twitter_api_secret, twitter_access_token, and twitter_access_token_secret."
      );
    }
    return new TwitterApi({
      appKey: config.apiKey,
      appSecret: config.apiSecret,
      accessToken: config.accessToken,
      accessSecret: config.accessTokenSecret,
    });
  }

  if (!config.bearerToken) {
    throw new Error("Bearer mode requires twitter_bearer_token.");
  }
  return new TwitterApi(config.bearerToken);
}

function normalizeHandle(value?: string | null) {
  if (!value) return "@unknown";
  return value.startsWith("@") ? value : `@${value}`;
}

function mapTweets(data: any[] | undefined, includes: any): TwitterTweet[] {
  const rows = data ?? [];
  const usersById = new Map<string, any>((includes?.users ?? []).map((u: any) => [u.id, u]));

  return rows
    .map((tweet: any) => {
      const author = tweet.author_id ? usersById.get(tweet.author_id) : null;
      const username = author?.username ? String(author.username) : "";
      return {
        id: String(tweet.id),
        text: String(tweet.text ?? ""),
        authorHandle: normalizeHandle(username),
        timestamp: String(tweet.created_at ?? ""),
        url: username ? `https://x.com/${username.replace(/^@/, "")}/status/${tweet.id}` : "",
      };
    })
    .filter((tweet) => tweet.id && tweet.text);
}

async function resolveUserId(client: TwitterApi, config: TwitterConfig): Promise<string> {
  if (config.userId) return config.userId;
  if (!config.username) throw new Error("Set twitter_user_id or twitter_username.");

  const handle = config.username.replace(/^@/, "");
  const response = await client.v2.userByUsername(handle);
  const id = response.data?.id;
  if (!id) throw new Error(`Could not resolve user id for @${handle}`);
  return id;
}

function tweetFields() {
  return {
    "tweet.fields": ["author_id", "created_at"] as any,
    expansions: ["author_id"] as any,
    "user.fields": ["username"] as any,
  };
}

export async function fetchTweets(config: TwitterConfig): Promise<TwitterTweet[]> {
  const client = buildClient(config);
  const maxResults = Math.max(10, Math.min(100, config.maxResults || 50));
  const fields = tweetFields();

  if (config.pullMode === "search_query") {
    if (!config.query?.trim()) {
      throw new Error("Search query mode requires twitter_query.");
    }
    const response = await client.v2.search(config.query, {
      ...fields,
      max_results: maxResults,
      sort_order: "recency",
    });
    return mapTweets(response.data.data, response.data.includes);
  }

  if (config.pullMode === "home_timeline") {
    if (config.mode !== "oauth1a") {
      throw new Error("Home timeline mode requires OAuth 1.0a credentials.");
    }
    const response = await client.v2.homeTimeline({
      ...fields,
      max_results: maxResults,
    });
    return mapTweets(response.data.data, response.data.includes);
  }

  const userId = await resolveUserId(client, config);
  const response = await client.v2.userTimeline(userId, {
    ...fields,
    max_results: maxResults,
  });
  return mapTweets(response.data.data, response.data.includes);
}
