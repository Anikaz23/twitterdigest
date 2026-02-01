#!/usr/bin/env node

/**
 * Save Digest Script
 *
 * Usage: node save-digest.js '<summary>' '<tweets_json>' '<topics_json>'
 */

const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH || "/data/digests.db";

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Get arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error("Usage: node save-digest.js '<summary>' '[tweets_json]' '[topics_json]'");
  process.exit(1);
}

const summary = args[0];
const rawTweets = args[1] || "[]";
const topics = args[2] || "[]";

try {
  const tweetsArray = JSON.parse(rawTweets);
  const topicsArray = JSON.parse(topics);

  const stmt = db.prepare(`
    INSERT INTO digests (summary, raw_tweets, tweet_count, topics, status)
    VALUES (?, ?, ?, ?, 'completed')
  `);

  const result = stmt.run(
    summary,
    rawTweets,
    tweetsArray.length,
    topics
  );

  console.log(JSON.stringify({
    success: true,
    id: result.lastInsertRowid,
    tweet_count: tweetsArray.length,
    topics: topicsArray
  }));

} catch (error) {
  console.error(JSON.stringify({
    success: false,
    error: error.message
  }));
  process.exit(1);
}

db.close();
