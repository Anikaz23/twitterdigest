"use client";

import { useEffect, useState } from "react";
import DigestList from "./digest-list";
import type { Digest } from "@/lib/types";

const CACHE_KEY = "digest:history:v3";

interface CachedHistory { digests: Digest[]; total: number; hasMore: boolean; }

function readCache(): CachedHistory | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedHistory) : null;
  } catch { return null; }
}

function writeCache(d: CachedHistory) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); } catch {}
}

export default function DigestListLoader() {
  const [digests, setDigests] = useState<Digest[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setDigests(cached.digests);
      setTotal(cached.total);
      setHasMore(cached.hasMore);
      setReady(true);
    }

    fetch("/api/digests?limit=20&offset=0")
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        const items: Digest[] = data.digests ?? [];
        const tot: number = data.pagination?.total ?? 0;
        const more: boolean = data.pagination?.hasMore ?? false;

        if (items.length) {
          setDigests(items);
          setTotal(tot);
          setHasMore(more);
          writeCache({ digests: items, total: tot, hasMore: more });
        }

        setReady(true);
      })
      .catch(() => { setReady(true); });
  }, []);

  return (
    <div className="page-stack">
      {ready && (
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)" }}>
          {total} digest{total === 1 ? "" : "s"} total
        </p>
      )}
      <DigestList key={ready && digests.length > 0 ? "loaded" : "empty"} initialDigests={digests} initialHasMore={hasMore} />
    </div>
  );
}
