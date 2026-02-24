import { NextRequest, NextResponse } from "next/server";
import { checkWorkerAuth } from "@/lib/backend/auth";
import { getSettings } from "@/lib/backend/db/repository";
import { nonEmptyOrDefault, numberOrDefault, pickSetting } from "@/lib/backend/settings";

const KEYS = [
  "ingestion_mode",
  "twitter_mode",
  "twitter_pull_mode",
  "summarizer_provider",
  "twitter_user_id",
  "twitter_username",
  "twitter_query",
  "twitter_max_results",
  "twitter_bearer_token",
  "twitter_api_key",
  "twitter_api_secret",
  "twitter_access_token",
  "twitter_access_token_secret",
] as const;

export async function GET(req: NextRequest) {
  const auth = await checkWorkerAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const all = await getSettings([...KEYS]);
    const read = (key: string, envValue?: string) => pickSetting(all, key, envValue);

    return NextResponse.json({
      ingestion_mode: nonEmptyOrDefault(read("ingestion_mode", process.env.INGESTION_MODE), "twitter_api"),
      twitter_mode: nonEmptyOrDefault(read("twitter_mode"), "bearer_token"),
      twitter_pull_mode: nonEmptyOrDefault(read("twitter_pull_mode", process.env.TWITTER_PULL_MODE), "user_timeline"),
      summarizer_provider: nonEmptyOrDefault(read("summarizer_provider", process.env.SUMMARIZER_PROVIDER), "auto"),
      twitter_user_id: read("twitter_user_id", process.env.TWITTER_USER_ID) ?? "",
      twitter_username: read("twitter_username", process.env.TWITTER_USERNAME) ?? "",
      twitter_query: read("twitter_query", process.env.TWITTER_QUERY) ?? "",
      twitter_max_results: numberOrDefault(read("twitter_max_results", process.env.TWITTER_MAX_RESULTS), 50),
      credentials: {
        twitter_bearer_token: read("twitter_bearer_token", process.env.TWITTER_BEARER_TOKEN) ?? "",
        twitter_api_key: read("twitter_api_key", process.env.TWITTER_API_KEY) ?? "",
        twitter_api_secret: read("twitter_api_secret", process.env.TWITTER_API_SECRET) ?? "",
        twitter_access_token: read("twitter_access_token", process.env.TWITTER_ACCESS_TOKEN) ?? "",
        twitter_access_token_secret:
          read("twitter_access_token_secret", process.env.TWITTER_ACCESS_TOKEN_SECRET) ?? "",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load worker config" }, { status: 500 });
  }
}
