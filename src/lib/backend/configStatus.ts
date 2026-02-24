import { getSettings, hasWorkerDigest } from "@/lib/backend/db/repository";
import { getResolvedDatabaseUrl } from "@/lib/backend/db/client";
import { isNonEmpty, nonEmptyOrDefault, numberOrDefault, pickSetting } from "@/lib/backend/settings";
import type {
  ConfigStatus,
  DatabaseProvider,
  IngestionMode,
  SummarizerProvider,
  TwitterPullMode,
  TwitterMode,
  UiTheme,
} from "@/lib/types";

const CREDENTIAL_KEYS = [
  "twitter_bearer_token",
  "twitter_api_key",
  "twitter_api_secret",
  "twitter_access_token",
  "twitter_access_token_secret",
  "openai_api_key",
  "anthropic_api_key",
  "cron_secret",
] as const;

const PLAIN_KEYS = [
  "ingestion_mode",
  "twitter_mode",
  "twitter_pull_mode",
  "summarizer_provider",
  "cron_schedule",
  "ui_theme",
  "database_provider",
  "database_label",
  "twitter_user_id",
  "twitter_username",
  "twitter_query",
  "twitter_max_results",
  "worker_allowed_ip",
  "worker_first_digest_received",
] as const;

function parseDatabaseHost(databaseUrl?: string): string {
  if (!databaseUrl) return "";
  try {
    return new URL(databaseUrl).host;
  } catch {
    return "";
  }
}

function inferDatabaseProvider(host: string): DatabaseProvider {
  const normalized = host.toLowerCase();
  if (normalized.includes("neon.tech")) return "neon";
  if (normalized.includes("supabase.co")) return "supabase";
  return "other";
}

function normalizeDatabaseProvider(value: string | null, fallback: DatabaseProvider): DatabaseProvider {
  // Host inference is ground truth — if the host identifies a specific provider, trust it unconditionally.
  if (fallback !== "other") return fallback;
  // For unrecognised hosts, use the stored explicit choice.
  if (value === "neon" || value === "supabase" || value === "other") return value;
  return fallback;
}

function normalizeTheme(value: string | null): UiTheme {
  return value === "twitter" ? "twitter" : "x";
}

function normalizePullMode(input: {
  value: string | null;
  twitterMode: TwitterMode;
  twitterUserId: string;
  twitterUsername: string;
  twitterQuery: string;
}): TwitterPullMode {
  if (input.value === "home_timeline" || input.value === "user_timeline" || input.value === "search_query") {
    return input.value;
  }

  if (input.twitterQuery.trim()) {
    return "search_query";
  }

  if (input.twitterMode === "oauth1a" && !input.twitterUserId.trim() && !input.twitterUsername.trim()) {
    return "home_timeline";
  }

  return "user_timeline";
}

export function defaultConfigStatus(options?: { databaseConnected?: boolean }): ConfigStatus {
  const databaseUrl = getResolvedDatabaseUrl();
  const inferredProvider = inferDatabaseProvider(parseDatabaseHost(databaseUrl));
  return {
    ingestion_mode: "twitter_api",
    twitter_mode: "bearer_token",
    twitter_pull_mode: "user_timeline",
    summarizer_provider: "auto",
    cron_schedule: process.env.CRON_SCHEDULE || "0 */3 * * *",
    ui_theme: "x",
    database_provider: inferredProvider,
    database_label: "",
    database_connected: options?.databaseConnected ?? false,
    database_host: parseDatabaseHost(databaseUrl),
    twitter_user_id: "",
    twitter_username: "",
    twitter_query: "",
    twitter_max_results: 50,
    worker_allowed_ip: "",
    worker_first_digest_received: false,
    configured: {
      twitter_bearer_token: false,
      twitter_api_key: false,
      twitter_api_secret: false,
      twitter_access_token: false,
      twitter_access_token_secret: false,
      openai_api_key: false,
      anthropic_api_key: false,
      cron_secret: false,
    },
  };
}

export async function buildConfigStatus(): Promise<ConfigStatus> {
  const all = await getSettings([...CREDENTIAL_KEYS, ...PLAIN_KEYS]);
  const read = (key: string, envValue?: string) => pickSetting(all, key, envValue);
  const databaseHost = parseDatabaseHost(getResolvedDatabaseUrl());
  const inferredProvider = inferDatabaseProvider(databaseHost);
  const twitterMode = nonEmptyOrDefault(read("twitter_mode"), "bearer_token") as TwitterMode;
  const twitterUserId = read("twitter_user_id", process.env.TWITTER_USER_ID) ?? "";
  const twitterUsername = read("twitter_username", process.env.TWITTER_USERNAME) ?? "";
  const twitterQuery = read("twitter_query", process.env.TWITTER_QUERY) ?? "";
  const twitterPullMode = normalizePullMode({
    value: read("twitter_pull_mode", process.env.TWITTER_PULL_MODE),
    twitterMode,
    twitterUserId,
    twitterUsername,
    twitterQuery,
  });
  const workerDigestFlag = isNonEmpty(read("worker_first_digest_received"));
  const workerFirstDigestReceived = workerDigestFlag ? true : await hasWorkerDigest();

  return {
    ingestion_mode: nonEmptyOrDefault(
      read("ingestion_mode", process.env.INGESTION_MODE),
      "twitter_api"
    ) as IngestionMode,
    twitter_mode: twitterMode,
    twitter_pull_mode: twitterPullMode,
    summarizer_provider: nonEmptyOrDefault(
      read("summarizer_provider", process.env.SUMMARIZER_PROVIDER),
      "auto"
    ) as SummarizerProvider,
    cron_schedule: nonEmptyOrDefault(read("cron_schedule", process.env.CRON_SCHEDULE), "0 */3 * * *"),
    ui_theme: normalizeTheme(read("ui_theme", process.env.UI_THEME)),
    database_provider: normalizeDatabaseProvider(read("database_provider"), inferredProvider),
    database_label: read("database_label", process.env.DATABASE_LABEL) ?? "",
    database_connected: true,
    database_host: databaseHost,
    twitter_user_id: twitterUserId,
    twitter_username: twitterUsername,
    twitter_query: twitterQuery,
    twitter_max_results: numberOrDefault(read("twitter_max_results", process.env.TWITTER_MAX_RESULTS), 50),
    worker_allowed_ip: read("worker_allowed_ip", process.env.WORKER_ALLOWED_IP) ?? "",
    worker_first_digest_received: workerFirstDigestReceived,
    configured: {
      twitter_bearer_token: isNonEmpty(read("twitter_bearer_token", process.env.TWITTER_BEARER_TOKEN)),
      twitter_api_key: isNonEmpty(read("twitter_api_key", process.env.TWITTER_API_KEY)),
      twitter_api_secret: isNonEmpty(read("twitter_api_secret", process.env.TWITTER_API_SECRET)),
      twitter_access_token: isNonEmpty(read("twitter_access_token", process.env.TWITTER_ACCESS_TOKEN)),
      twitter_access_token_secret: isNonEmpty(
        read("twitter_access_token_secret", process.env.TWITTER_ACCESS_TOKEN_SECRET)
      ),
      openai_api_key: isNonEmpty(read("openai_api_key", process.env.OPENAI_API_KEY)),
      anthropic_api_key: isNonEmpty(read("anthropic_api_key", process.env.ANTHROPIC_API_KEY)),
      cron_secret: isNonEmpty(read("cron_secret", process.env.CRON_SECRET)),
    },
  };
}
