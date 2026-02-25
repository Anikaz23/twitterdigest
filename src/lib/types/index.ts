export type DigestStatus = "running" | "completed" | "failed";
export type IngestionMode = "twitter_api" | "external_worker";
export type TwitterMode = "bearer_token" | "oauth1a";
export type TwitterPullMode = "home_timeline" | "user_timeline" | "search_query";
export type SummarizerProvider = "auto" | "openai" | "anthropic";
export type UiTheme = "x" | "twitter";
export type DatabaseProvider = "neon" | "supabase" | "other";

export interface Tweet {
  id: string;
  text: string;
  authorHandle: string;
  timestamp: string;
  url: string;
}

export interface DigestTweet extends Tweet {
  position: number;
  isNew: boolean;
}

export interface Digest {
  id: number;
  date: string;
  title: string;
  created_at: string;
  summary: string;
  topics: string[];
  status: DigestStatus;
  source: string | null;
  idempotency_key: string | null;
  worker_run_id: string | null;
  latest_tweet_id: string | null;
  metadata: {
    fetchedCount?: number;
    uniqueCount?: number;
    newCount?: number;
    seenCount?: number;
    [key: string]: unknown;
  } | null;
}

export interface DigestListResponse {
  digests: Digest[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ConfigStatus {
  ingestion_mode: IngestionMode;
  twitter_mode: TwitterMode;
  twitter_pull_mode: TwitterPullMode;
  summarizer_provider: SummarizerProvider;
  cron_schedule: string;
  ui_theme: UiTheme;
  database_provider: DatabaseProvider;
  database_label: string;
  database_connected: boolean;
  database_host: string;
  twitter_user_id: string;
  twitter_username: string;
  twitter_query: string;
  twitter_max_results: number;
  worker_allowed_ip: string;
  worker_first_digest_received: boolean;
  configured: {
    twitter_bearer_token: boolean;
    twitter_api_key: boolean;
    twitter_api_secret: boolean;
    twitter_access_token: boolean;
    twitter_access_token_secret: boolean;
    openai_api_key: boolean;
    anthropic_api_key: boolean;
    cron_secret: boolean;
  };
}
