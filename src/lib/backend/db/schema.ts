import { getPool } from "./client";

declare global {
  // eslint-disable-next-line no-var
  var __schemaReady: Promise<void> | undefined;
}

export async function ensureSchema(): Promise<void> {
  if (!global.__schemaReady) {
    global.__schemaReady = runMigrations();
  }
  await global.__schemaReady;
}

export function resetSchemaCache(): void {
  global.__schemaReady = undefined;
}

async function runMigrations() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS digests (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        summary TEXT NOT NULL,
        topics JSONB NOT NULL DEFAULT '[]'::jsonb,
        status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('running', 'completed', 'failed')),
        source TEXT,
        idempotency_key TEXT,
        worker_run_id TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb
      );
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_digests_idempotency_key
      ON digests(idempotency_key)
      WHERE idempotency_key IS NOT NULL;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_digests_created_at
      ON digests(created_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tweets (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        author_handle TEXT NOT NULL,
        timestamp TEXT,
        url TEXT,
        first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tweets_last_seen
      ON tweets(last_seen_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS digest_tweets (
        digest_id INTEGER NOT NULL REFERENCES digests(id) ON DELETE CASCADE,
        tweet_id TEXT NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        is_new BOOLEAN NOT NULL DEFAULT TRUE,
        PRIMARY KEY (digest_id, tweet_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cron_logs (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        status TEXT NOT NULL CHECK(status IN ('digest_created', 'no_new_data', 'skipped', 'error')),
        digest_id INTEGER REFERENCES digests(id) ON DELETE SET NULL,
        message TEXT
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cron_logs_created_at
      ON cron_logs(created_at DESC);
    `);
  } finally {
    client.release();
  }
}
