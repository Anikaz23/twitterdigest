#!/bin/bash
set -e

echo "Starting Twitter Digest Agent..."

# Initialize database if it doesn't exist
if [ ! -f /data/digests.db ]; then
    echo "Initializing database..."
    sqlite3 /data/digests.db <<EOF
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
EOF
    echo "Database initialized."
fi

# Replace API key placeholder in config
if [ -n "$ANTHROPIC_API_KEY" ]; then
    sed -i "s/\${ANTHROPIC_API_KEY}/$ANTHROPIC_API_KEY/g" /root/.openclaw/openclaw.json
    echo "API key configured."
else
    echo "WARNING: ANTHROPIC_API_KEY not set!"
fi

# Start OpenClaw gateway
echo "Starting OpenClaw gateway..."
exec openclaw gateway --port 18789 --verbose
