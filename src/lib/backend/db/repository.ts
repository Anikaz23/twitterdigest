import { getPool } from "./client";
import { ensureSchema } from "./schema";
import type { Digest, DigestStatus, DigestTweet } from "@/lib/types";

export interface StoredTweet {
  id: string;
  text: string;
  authorHandle: string;
  timestamp: string;
  url: string;
}

function toDigest(row: any): Digest {
  const createdAt = new Date(row.created_at);
  const digestDate = Number.isNaN(createdAt.getTime())
    ? String(row.created_at).slice(0, 10)
    : createdAt.toISOString().slice(0, 10);
  const summary = String(row.summary ?? "");
  const metadata = row.metadata ?? null;
  const rawTitle =
    metadata && typeof metadata === "object" && typeof (metadata as Record<string, unknown>).title === "string"
      ? String((metadata as Record<string, unknown>).title)
      : "";
  const fallbackTitle =
    summary
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) || "Digest update";
  const title = (rawTitle.trim() || fallbackTitle).slice(0, 140);

  return {
    id: Number(row.id),
    date: digestDate,
    title,
    created_at: String(row.created_at),
    summary,
    topics: Array.isArray(row.topics) ? row.topics.map((v: unknown) => String(v)) : [],
    status: row.status as DigestStatus,
    source: row.source ?? null,
    idempotency_key: row.idempotency_key ?? null,
    worker_run_id: row.worker_run_id ?? null,
    metadata,
    latest_tweet_id: row.latest_tweet_id ?? null,
  };
}

function toDigestTweet(row: any): DigestTweet {
  const author = typeof row.author_handle === "string" && row.author_handle.trim() ? row.author_handle.trim() : "@unknown";
  return {
    id: String(row.id),
    text: String(row.text ?? ""),
    authorHandle: author.startsWith("@") ? author : `@${author}`,
    timestamp: String(row.timestamp ?? ""),
    url: String(row.url ?? ""),
    position: Number(row.position ?? 0),
    isNew: Boolean(row.is_new),
  };
}

export async function getDigests(limit = 20, offset = 0): Promise<Digest[]> {
  await ensureSchema();
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT * FROM digests
     WHERE status = 'completed'
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows.map(toDigest);
}

export async function getLatestDigest(): Promise<Digest | null> {
  await ensureSchema();
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT * FROM digests
     WHERE status = 'completed'
     ORDER BY created_at DESC
     LIMIT 1`
  );
  if (!rows[0]) return null;
  return toDigest(rows[0]);
}

export async function getDigestById(id: number): Promise<Digest | null> {
  await ensureSchema();
  const pool = getPool();
  const { rows } = await pool.query("SELECT * FROM digests WHERE id = $1 LIMIT 1", [id]);
  if (!rows[0]) return null;
  return toDigest(rows[0]);
}

export async function getTweetsForDigest(digestId: number, limit = 40): Promise<DigestTweet[]> {
  await ensureSchema();
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT
       t.id,
       t.text,
       t.author_handle,
       t.timestamp,
       t.url,
       dt.position,
       dt.is_new
     FROM digest_tweets dt
     JOIN tweets t ON t.id = dt.tweet_id
     WHERE dt.digest_id = $1
     ORDER BY dt.position ASC
     LIMIT $2`,
    [digestId, Math.min(Math.max(limit, 1), 100)]
  );
  return rows.map(toDigestTweet);
}

export async function getTotalDigestCount(): Promise<number> {
  await ensureSchema();
  const pool = getPool();
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS count FROM digests WHERE status = 'completed'`);
  return Number(rows[0]?.count ?? 0);
}

export async function insertCronLog(params: {
  status: "digest_created" | "no_new_data" | "skipped" | "error";
  digestId?: number | null;
  message?: string | null;
}): Promise<void> {
  await ensureSchema();
  const pool = getPool();
  await pool.query(
    `INSERT INTO cron_logs (status, digest_id, message) VALUES ($1, $2, $3)`,
    [params.status, params.digestId ?? null, params.message ?? null]
  );
}

export async function hasWorkerDigest(): Promise<boolean> {
  await ensureSchema();
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT 1
     FROM digests
     WHERE source = 'external_worker' OR worker_run_id IS NOT NULL
     LIMIT 1`
  );
  return Boolean(rows[0]);
}

export async function saveDigest(params: {
  summary: string;
  topics?: string[] | null;
  status?: DigestStatus;
  source?: string | null;
  idempotencyKey?: string | null;
  workerRunId?: string | null;
  metadata?: Record<string, unknown> | null;
  latestTweetId?: string | null;
}): Promise<number> {
  await ensureSchema();
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO digests (summary, topics, status, source, idempotency_key, worker_run_id, metadata, latest_tweet_id)
     VALUES ($1, $2::jsonb, $3, $4, $5, $6, $7::jsonb, $8)
     RETURNING id`,
    [
      params.summary,
      JSON.stringify(params.topics ?? []),
      params.status ?? "completed",
      params.source ?? null,
      params.idempotencyKey ?? null,
      params.workerRunId ?? null,
      JSON.stringify(params.metadata ?? {}),
      params.latestTweetId ?? null,
    ]
  );
  return Number(rows[0].id);
}

export async function getDigestByIdempotencyKey(idempotencyKey: string): Promise<Digest | null> {
  await ensureSchema();
  const pool = getPool();
  const { rows } = await pool.query("SELECT * FROM digests WHERE idempotency_key = $1 LIMIT 1", [idempotencyKey]);
  if (!rows[0]) return null;
  return toDigest(rows[0]);
}

export async function getExistingTweetIds(ids: string[]): Promise<Set<string>> {
  await ensureSchema();
  if (!ids.length) return new Set();
  const pool = getPool();
  const { rows } = await pool.query<{ id: string }>("SELECT id FROM tweets WHERE id = ANY($1::text[])", [ids]);
  return new Set(rows.map((row: { id: string }) => String(row.id)));
}

export async function upsertTweets(tweets: StoredTweet[]): Promise<void> {
  await ensureSchema();
  if (!tweets.length) return;

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const tweet of tweets) {
      await client.query(
        `INSERT INTO tweets (id, text, author_handle, timestamp, url)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT(id) DO UPDATE SET
           text = EXCLUDED.text,
           author_handle = EXCLUDED.author_handle,
           timestamp = EXCLUDED.timestamp,
           url = EXCLUDED.url,
           last_seen_at = NOW()`,
        [tweet.id, tweet.text, tweet.authorHandle, tweet.timestamp || null, tweet.url || null]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function saveDigestTweetLinks(params: {
  digestId: number;
  allTweets: StoredTweet[];
  newTweetIds: Set<string>;
}): Promise<void> {
  await ensureSchema();
  if (!params.allTweets.length) return;

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < params.allTweets.length; i += 1) {
      const tweet = params.allTweets[i];
      await client.query(
        `INSERT INTO digest_tweets (digest_id, tweet_id, position, is_new)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (digest_id, tweet_id) DO UPDATE SET
           position = EXCLUDED.position,
           is_new = EXCLUDED.is_new`,
        [params.digestId, tweet.id, i + 1, params.newTweetIds.has(tweet.id)]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getSetting(key: string): Promise<string | null> {
  await ensureSchema();
  const pool = getPool();
  const { rows } = await pool.query("SELECT value FROM settings WHERE key = $1", [key]);
  if (!rows[0]) return null;
  return String(rows[0].value);
}

export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
  await ensureSchema();
  if (!keys.length) return {};

  const pool = getPool();
  const { rows } = await pool.query<{ key: string; value: string }>(
    "SELECT key, value FROM settings WHERE key = ANY($1::text[])",
    [keys]
  );
  const map = new Map<string, string>(
    rows.map((row: { key: string; value: string }) => [String(row.key), String(row.value)])
  );
  const result: Record<string, string | null> = {};
  for (const key of keys) {
    result[key] = map.get(key) ?? null;
  }
  return result;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await ensureSchema();
  const pool = getPool();
  await pool.query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, value]
  );
}

export async function deleteSetting(key: string): Promise<void> {
  await ensureSchema();
  const pool = getPool();
  await pool.query("DELETE FROM settings WHERE key = $1", [key]);
}
