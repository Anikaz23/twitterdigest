"use client";

import { useEffect, useState } from "react";
import DigestList from "./digest-list";
import type { Digest } from "@/lib/types";
import { getDemoDigests } from "@/lib/demo/digests";

const CACHE_KEY = "digest:history:v2";
const FORCE_DEMO_MODE = true;

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
  const [digests, setDigests] = useState<Digest[]>(() => getDemoDigests());
  const [total, setTotal] = useState(() => getDemoDigests().length);
  const [hasMore, setHasMore] = useState(false);
  const [ready, setReady] = useState(true);

  useEffect(() => {
    if (FORCE_DEMO_MODE) return;

    // Show cached data immediately
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
        } else if (!cached) {
          const demo = getDemoDigests();
          setDigests(demo);
          setTotal(demo.length);
          setHasMore(false);
        }

        setReady(true);
      })
      .catch(() => {
        if (!cached) {
          const demo = getDemoDigests();
          setDigests(demo);
          setTotal(demo.length);
          setHasMore(false);
          setReady(true);
        }
      });
  }, []);

  return (
    <div className="page-stack">
      <div>
        <h1 className="page-title">History</h1>
        {ready && (
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text-2)" }}>
            {total} digest{total === 1 ? "" : "s"} total
          </p>
        )}
      </div>
      {ready && <DigestList initialDigests={digests} initialHasMore={hasMore} />}
    </div>
  );
}
