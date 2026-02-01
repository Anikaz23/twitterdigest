import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Database path - Docker volume mount point
const DB_PATH = process.env.DB_PATH || "/data/digests.db";
const SCHEMA_PATH = path.join(process.cwd(), "schema.sql");

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database with schema
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Run schema if tables don't exist
const tableExists = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='digests'")
  .get();

if (!tableExists) {
  // Inline schema for Docker builds
  db.exec(`
    CREATE TABLE IF NOT EXISTS digests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      summary TEXT NOT NULL,
      raw_tweets TEXT,
      tweet_count INTEGER DEFAULT 0,
      topics TEXT,
      status TEXT DEFAULT 'completed' CHECK(status IN ('running', 'completed', 'failed'))
    );
    CREATE INDEX IF NOT EXISTS idx_digests_created_at ON digests(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_digests_status ON digests(status);
  `);
}

// Types
export interface Digest {
  id: number;
  created_at: string;
  summary: string;
  raw_tweets: string | null;
  tweet_count: number;
  topics: string | null;
  status: "running" | "completed" | "failed";
}

export interface DigestWithParsed extends Omit<Digest, "raw_tweets" | "topics"> {
  raw_tweets: Tweet[] | null;
  topics: string[] | null;
}

export interface Tweet {
  id: string;
  text: string;
  author: string;
  authorHandle: string;
  likes: number;
  retweets: number;
  timestamp: string;
  hasMedia: boolean;
  url: string;
}

// Queries
export function getLatestDigest(): DigestWithParsed | null {
  const row = db
    .prepare(
      "SELECT * FROM digests WHERE status = 'completed' ORDER BY created_at DESC LIMIT 1"
    )
    .get() as Digest | undefined;

  if (!row) return null;
  return parseDigest(row);
}

export function getDigests(limit = 20, offset = 0): DigestWithParsed[] {
  const rows = db
    .prepare(
      "SELECT * FROM digests WHERE status = 'completed' ORDER BY created_at DESC LIMIT ? OFFSET ?"
    )
    .all(limit, offset) as Digest[];

  return rows.map(parseDigest);
}

export function getDigestById(id: number): DigestWithParsed | null {
  const row = db
    .prepare("SELECT * FROM digests WHERE id = ?")
    .get(id) as Digest | undefined;

  if (!row) return null;
  return parseDigest(row);
}

export function getTotalDigestCount(): number {
  const result = db
    .prepare("SELECT COUNT(*) as count FROM digests WHERE status = 'completed'")
    .get() as { count: number };
  return result.count;
}

// Helper to parse JSON fields
function parseDigest(row: Digest): DigestWithParsed {
  return {
    ...row,
    raw_tweets: row.raw_tweets ? JSON.parse(row.raw_tweets) : null,
    topics: row.topics ? JSON.parse(row.topics) : null,
  };
}

export default db;
