"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DigestCard from "@/components/digest-card";
import type { Digest } from "@/lib/types";
import { getDemoDigests } from "@/lib/demo/digests";

const FORCE_DEMO_MODE = true;

function normalizeId(input: string): number | null {
  const parsed = Number(input);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function findDemoDigest(id: number): Digest | null {
  return getDemoDigests().find((digest) => digest.id === id) ?? null;
}

export default function DigestDetailLoader({ digestId }: { digestId: string }) {
  const normalizedId = useMemo(() => normalizeId(digestId), [digestId]);
  const [digest, setDigest] = useState<Digest | null>(() => {
    if (!normalizedId) return null;
    return findDemoDigest(normalizedId);
  });

  useEffect(() => {
    if (!normalizedId) {
      setDigest(null);
      return;
    }

    if (FORCE_DEMO_MODE) {
      setDigest(findDemoDigest(normalizedId));
      return;
    }

    fetch(`/api/digests/${normalizedId}`)
      .then(async (res) => {
        if (!res.ok) return;
        const payload = (await res.json()) as Digest;
        setDigest(payload);
      })
      .catch(() => {});
  }, [normalizedId]);

  if (!normalizedId || !digest) {
    return (
      <div className="page-stack">
        <div className="card card-soft">
          <p className="empty-state-title" style={{ marginBottom: 4 }}>Digest not found</p>
          <p className="empty-state-desc" style={{ margin: 0, textAlign: "left" }}>
            Open a digest from Home or History.
          </p>
        </div>
        <div>
          <Link href="/" className="history-link">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div>
        <Link href="/" className="history-link">← Back to Home</Link>
      </div>
      <DigestCard digest={digest} initiallyExpanded />
    </div>
  );
}
