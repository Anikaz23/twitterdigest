-- Twitter Digest Database Schema

CREATE TABLE IF NOT EXISTS digests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  summary TEXT NOT NULL,
  raw_tweets TEXT, -- JSON array of tweet objects
  tweet_count INTEGER DEFAULT 0,
  topics TEXT, -- JSON array of topic strings
  status TEXT DEFAULT 'completed' CHECK(status IN ('running', 'completed', 'failed'))
);

-- Index for faster queries by date
CREATE INDEX IF NOT EXISTS idx_digests_created_at ON digests(created_at DESC);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_digests_status ON digests(status);
