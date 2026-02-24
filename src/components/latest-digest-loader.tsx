"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DigestCard from "./digest-card";
import type { Digest } from "@/lib/types";
import { getLatestDemoDigest } from "@/lib/demo/digests";

const CACHE_KEY = "digest:latest:v2";
const FORCE_DEMO_MODE = true;

function readCache(): Digest | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Digest) : null;
  } catch { return null; }
}

function writeCache(d: Digest) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); } catch {}
}

export default function LatestDigestLoader() {
  const [digest, setDigest] = useState<Digest>(() => getLatestDemoDigest());

  useEffect(() => {
    if (FORCE_DEMO_MODE) return;

    // Show cached data immediately while fetching fresh
    const cached = readCache();
    if (cached) {
      setDigest(cached);
    }

    fetch("/api/digests/latest")
      .then(async (r) => {
        if (r.status === 404) {
          return;
        }
        if (!r.ok) {
          return;
        }
        const data = await r.json() as Digest;
        setDigest(data);
        writeCache(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="page-stack">
      <DigestCard digest={digest} initiallyExpanded />
      <div style={{ paddingLeft: 2 }}>
        <Link href="/history" className="history-link">
          View all digests →
        </Link>
      </div>
    </div>
  );
}
