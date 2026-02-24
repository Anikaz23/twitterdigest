"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import type { Digest, DigestTweet } from "@/lib/types";

const tweetCache = new Map<number, DigestTweet[]>();
const inFlightTweetFetches = new Map<number, Promise<DigestTweet[]>>();

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatTweetTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isRealTweetUrl(url: string): boolean {
  if (!url) return false;
  try {
    const { hostname, pathname } = new URL(url);
    return (hostname === "twitter.com" || hostname === "x.com") && pathname.includes("/status/");
  } catch { return false; }
}

function avatarLabel(handle: string) {
  const normalized = handle.replace(/^@/, "").trim();
  return normalized ? normalized.charAt(0).toUpperCase() : "U";
}

function extractEmbeddedTweets(digest: Digest): DigestTweet[] | null {
  const source =
    digest.metadata?.demoTweets ||
    digest.metadata?.demo_tweets ||
    digest.metadata?.tweets ||
    null;
  if (!Array.isArray(source)) return null;

  const normalized = source
    .map((row, index): DigestTweet | null => {
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      const id = typeof item.id === "string" ? item.id : `embedded-${digest.id}-${index}`;
      const text = typeof item.text === "string" ? item.text : "";
      if (!text.trim()) return null;
      const authorHandle = typeof item.authorHandle === "string" ? item.authorHandle : "@unknown";
      const timestamp = typeof item.timestamp === "string" ? item.timestamp : "";
      const url = typeof item.url === "string" ? item.url : "";
      const position = Number(item.position);
      const isNew = typeof item.isNew === "boolean" ? item.isNew : true;

      return {
        id,
        text,
        authorHandle,
        timestamp,
        url,
        position: Number.isFinite(position) ? position : index + 1,
        isNew,
      };
    })
    .filter((row): row is DigestTweet => Boolean(row));

  return normalized.length ? normalized : null;
}

async function fetchTweetsForDigest(digestId: number, limit = 40): Promise<DigestTweet[]> {
  const cached = tweetCache.get(digestId);
  if (cached) return cached;

  const inFlight = inFlightTweetFetches.get(digestId);
  if (inFlight) return inFlight;

  const request = (async () => {
    const res = await fetch(`/api/digests/${digestId}/tweets?limit=${limit}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Failed to load tweets.");
    }

    const tweets = Array.isArray(data?.tweets) ? (data.tweets as DigestTweet[]) : [];
    tweetCache.set(digestId, tweets);
    return tweets;
  })().finally(() => {
    inFlightTweetFetches.delete(digestId);
  });

  inFlightTweetFetches.set(digestId, request);
  return request;
}

export default function DigestCard({
  digest,
  initiallyExpanded = false,
}: {
  digest: Digest;
  initiallyExpanded?: boolean;
}) {
  const embeddedTweets = extractEmbeddedTweets(digest);
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [tweets, setTweets] = useState<DigestTweet[] | null>(() => embeddedTweets ?? tweetCache.get(digest.id) ?? null);
  const [loadingTweets, setLoadingTweets] = useState(false);
  const [tweetsError, setTweetsError] = useState("");
  const newCount = Number((digest.metadata?.newCount as number) ?? (digest.metadata?.uniqueCount as number) ?? 0);

  const summaryParagraphs = useMemo(
    () =>
      digest.summary
        .split(/\n{2,}/)
        .map((part) => part.trim())
        .filter(Boolean),
    [digest.summary]
  );

  async function loadTweets() {
    if (tweets || loadingTweets) return;
    if (embeddedTweets && embeddedTweets.length) {
      setTweets(embeddedTweets);
      return;
    }
    setLoadingTweets(true);
    setTweetsError("");
    try {
      const items = await fetchTweetsForDigest(digest.id, 40);
      setTweets(items);
    } catch (error: any) {
      setTweetsError(error?.message || "Failed to load tweets.");
    } finally {
      setLoadingTweets(false);
    }
  }

  function prefetchTweets() {
    if (tweets || loadingTweets || (embeddedTweets && embeddedTweets.length)) return;
    void fetchTweetsForDigest(digest.id, 40)
      .then((items) => {
        setTweets((current) => current ?? items);
      })
      .catch(() => {
        // Ignore prefetch errors; surface errors only on explicit expand/load.
      });
  }

  function toggleExpanded() {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      void loadTweets();
    }
  }

  useEffect(() => {
    if (expanded) {
      void loadTweets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  function handleCardClick(event: MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, select, textarea, label")) return;
    toggleExpanded();
  }

  function handleHeadClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    toggleExpanded();
  }

  return (
    <article className="card timeline-card" onClick={handleCardClick}>
      <button
        type="button"
        className="digest-head-btn"
        onClick={handleHeadClick}
        onMouseEnter={prefetchTweets}
        onFocus={prefetchTweets}
      >
        <div className="digest-head-main">
          <p className="digest-title">{digest.title}</p>
          <div className="digest-meta">
            <span>{digest.date}</span>
            <span className="mono">{formatTime(digest.created_at)}</span>
          </div>
        </div>

        <div className="digest-head-side">
          {newCount > 0 && (
            <span className="digest-count-chip" aria-label={`${newCount} tweets`}>
              <span className="digest-count-number">{newCount}</span>
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="digest-body">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {summaryParagraphs.length ? (
              summaryParagraphs.map((paragraph, index) => (
                <p key={`${digest.id}-summary-${index}`} className="digest-summary">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="digest-summary">{digest.summary}</p>
            )}
          </div>

          {loadingTweets && <p className="muted" style={{ margin: 0 }}>Loading tweets…</p>}
          {tweetsError && <p className="status-error" style={{ margin: 0 }}>{tweetsError}</p>}

          {tweets && tweets.length > 0 && (
            <div className="tweet-strip">
              {tweets.map((tweet) => (
                <article key={tweet.id} className="tweet-card">
                  <div className="tweet-card-top">
                    <div className="tweet-avatar">{avatarLabel(tweet.authorHandle)}</div>
                    <div style={{ minWidth: 0 }}>
                      <p className="tweet-author">{tweet.authorHandle}</p>
                      <p className="tweet-time">{formatTweetTime(tweet.timestamp)}</p>
                    </div>
                  </div>

                  <p className="tweet-text">{tweet.text}</p>

                  {isRealTweetUrl(tweet.url) && (
                    <a className="tweet-link" href={tweet.url} target="_blank" rel="noreferrer">
                      Open on X
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}

          {tweets && tweets.length === 0 && !loadingTweets && !tweetsError && (
            <p className="muted" style={{ margin: 0 }}>
              No tweets were linked to this digest.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
