"use client";

import { useState } from "react";
import DigestCard from "./DigestCard";
import { Digest } from "@/lib/types";

interface DigestListProps {
  initialDigests: Digest[];
  initialHasMore: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function DigestList({
  initialDigests,
  initialHasMore,
}: DigestListProps) {
  const [digests, setDigests] = useState(initialDigests);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(initialDigests.length);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/digests?offset=${offset}&limit=10`);
      const data = await response.json();

      setDigests((prev) => [...prev, ...data.digests]);
      setHasMore(data.pagination.hasMore);
      setOffset((prev) => prev + data.digests.length);
    } catch (error) {
      console.error("Failed to load more digests:", error);
    } finally {
      setLoading(false);
    }
  };

  if (digests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No digests yet.</p>
        <p className="text-gray-600 text-sm mt-2">
          Digests will appear here once the agent runs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {digests.map((digest) => (
        <DigestCard key={digest.id} digest={digest} />
      ))}

      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
