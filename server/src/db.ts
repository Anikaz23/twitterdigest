import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Default to local ./data for development, /data for Docker
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "digests.db");

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Initialize schema
const tableExists = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='digests'")
  .get();

if (!tableExists) {
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

// Raw database row type
interface DigestRow {
  id: number;
  created_at: string;
  summary: string;
  raw_tweets: string | null;
  tweet_count: number;
  topics: string | null;
  status: string;
}

// Parse JSON fields
function parseDigest(row: DigestRow) {
  return {
    ...row,
    raw_tweets: row.raw_tweets ? JSON.parse(row.raw_tweets) : null,
    topics: row.topics ? JSON.parse(row.topics) : null,
  };
}

export function getLatestDigest() {
  const row = db
    .prepare("SELECT * FROM digests WHERE status = 'completed' ORDER BY created_at DESC LIMIT 1")
    .get() as DigestRow | undefined;

  return row ? parseDigest(row) : null;
}

export function getDigests(limit = 20, offset = 0) {
  const rows = db
    .prepare("SELECT * FROM digests WHERE status = 'completed' ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(limit, offset) as DigestRow[];

  return rows.map(parseDigest);
}

export function getDigestById(id: number) {
  const row = db
    .prepare("SELECT * FROM digests WHERE id = ?")
    .get(id) as DigestRow | undefined;

  return row ? parseDigest(row) : null;
}

export function getTotalDigestCount(): number {
  const result = db
    .prepare("SELECT COUNT(*) as count FROM digests WHERE status = 'completed'")
    .get() as { count: number };
  return result.count;
}

export default db;
