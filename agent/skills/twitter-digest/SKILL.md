# Twitter Digest Skill

Automatically digest your Twitter "For You" feed every 3 hours and save summaries to the database.

## Schedule

```cron
0 */3 * * *
```

This skill runs every 3 hours automatically.

## What This Skill Does

1. Opens Twitter (x.com) in the browser
2. Navigates to the "For You" feed
3. Scrolls through and captures ~50 tweets
4. Extracts: text, author, engagement metrics, media presence
5. Generates an AI summary of the content
6. Identifies key topics and themes
7. Saves the digest to the SQLite database

## Required Tools

- `browser` - For navigating Twitter and capturing content
- `bash` - For saving to database via script

## Manual Trigger

To manually trigger a digest, say: "Run the Twitter digest now"

## Instructions

When this skill runs (either on schedule or manually triggered):

### Step 1: Open Twitter

Use the browser to navigate to https://x.com/home

Wait for the page to fully load. If you see a login screen, notify the user that they need to authenticate first.

Ensure you're on the "For You" tab (not "Following").

### Step 2: Capture Tweets

Scroll down slowly to load more tweets. Capture approximately 50 tweets.

For each tweet, extract:
- Tweet text content
- Author display name and @handle
- Like count
- Retweet count
- Whether it has images/videos
- Tweet URL if visible

Store tweets as a JSON array like this:
```json
[
  {
    "id": "tweet_id_or_index",
    "text": "Tweet content here...",
    "author": "Display Name",
    "authorHandle": "@handle",
    "likes": 1234,
    "retweets": 567,
    "timestamp": "2h",
    "hasMedia": true,
    "url": "https://x.com/handle/status/..."
  }
]
```

### Step 3: Generate Summary

Analyze all captured tweets and write a comprehensive summary (300-500 words) covering:
- Main topics and themes being discussed
- Notable news or announcements
- Trending conversations
- Interesting takes or opinions
- Any viral content

Also identify 3-7 topic tags that represent the main themes (e.g., "AI", "Tech News", "Politics", "Crypto").

### Step 4: Save to Database

Run the save script to store the digest:

```bash
node /app/save-digest.js '<SUMMARY_TEXT>' '<TWEETS_JSON>' '<TOPICS_JSON>'
```

Where:
- `<SUMMARY_TEXT>` is the generated summary (escape quotes properly)
- `<TWEETS_JSON>` is the JSON array of tweets
- `<TOPICS_JSON>` is a JSON array of topic strings like `["AI", "Tech"]`

### Step 5: Report Completion

Log that the digest was successfully created, including:
- Number of tweets processed
- Topics identified
- Database insert ID

## Error Handling

- If Twitter fails to load, wait 30 seconds and retry once
- If login is required, log an error asking user to authenticate in the browser
- If the database write fails, log the error with the summary for manual review
