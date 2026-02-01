// Shared types between dashboard and server

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

export interface Digest {
  id: number;
  created_at: string;
  summary: string;
  raw_tweets: Tweet[] | null;
  tweet_count: number;
  topics: string[] | null;
  status: "running" | "completed" | "failed";
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
