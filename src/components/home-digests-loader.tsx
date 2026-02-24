"use client";

import { useEffect, useMemo, useState } from "react";
import DigestCard from "@/components/digest-card";
import type { Digest } from "@/lib/types";

const CACHE_KEY = "digest:home:v1";

interface CachedHomeDigests {
  digests: Digest[];
}

function readCache(): CachedHomeDigests | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedHomeDigests) : null;
  } catch {
    return null;
  }
}

function writeCache(payload: CachedHomeDigests) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {}
}

function dayKey(daysAgo = 0): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sortDigests(items: Digest[]): Digest[] {
  return [...items].sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return tb - ta;
  });
}

function formatMiniTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function HomeDigestsLoader() {
  const [mounted, setMounted] = useState(false);
  const [digests, setDigests] = useState<Digest[]>([]);
  const [selectedDigest, setSelectedDigest] = useState<Digest | null>(null);
  const [yesterdayRecapOpen, setYesterdayRecapOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const cached = readCache();
    if (cached?.digests?.length) {
      setDigests(sortDigests(cached.digests));
    }

    fetch("/api/digests?limit=64&offset=0")
      .then(async (res) => {
        if (!res.ok) return;
        const payload = await res.json();
        const items = Array.isArray(payload?.digests) ? (payload.digests as Digest[]) : [];
        if (!items.length) return;
        const sorted = sortDigests(items);
        setDigests(sorted);
        writeCache({ digests: sorted });
      })
      .catch(() => {});
  }, []);

  const anyOverlayOpen = Boolean(selectedDigest) || yesterdayRecapOpen;

  useEffect(() => {
    if (!anyOverlayOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedDigest(null);
        setYesterdayRecapOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [anyOverlayOpen]);

  const { latestDigest, todayDigests, yesterdayDigests, yesterdayRecapParagraphs } = useMemo(() => {
    const sorted = sortDigests(digests);
    const latest = sorted[0] ?? null;
    const today = dayKey(0);
    const yesterday = dayKey(1);

    const todays = sorted.filter((d) => d.date === today && (!latest || d.id !== latest.id));
    const yesterdays = sorted.filter((d) => d.date === yesterday);
    const recapParagraphs = [...yesterdays]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .flatMap((digest) =>
        digest.summary
          .split(/\n{2,}/)
          .map((part) => part.trim())
          .filter(Boolean)
      );

    return {
      latestDigest: latest,
      todayDigests: todays,
      yesterdayDigests: yesterdays,
      yesterdayRecapParagraphs: recapParagraphs,
    };
  }, [digests]);

  if (!latestDigest) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🐦</div>
        <p className="empty-state-title">No digests yet</p>
        <p className="empty-state-desc">Once ingest runs, your latest digest will appear here.</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="home-section">
        <div className="home-section-head">
          <h2 className="section-title">Latest Digest</h2>
        </div>
        <DigestCard digest={latestDigest} initiallyExpanded />
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2 className="section-title">Today's Digests</h2>
          <p className="home-section-meta">{todayDigests.length} digest{todayDigests.length === 1 ? "" : "s"}</p>
        </div>
        {todayDigests.length ? (
          <div className="digest-rail">
            {todayDigests.map((digest) => {
              const newCount = Number(
                (digest.metadata?.newCount as number) ?? (digest.metadata?.uniqueCount as number) ?? 0
              );
              return (
                <button
                  key={digest.id}
                  type="button"
                  className="digest-mini-card digest-mini-btn"
                  onClick={() => setSelectedDigest(digest)}
                >
                  <p className="digest-mini-title">{digest.title}</p>
                  <div className="digest-mini-meta">
                    <span suppressHydrationWarning>{mounted ? formatMiniTime(digest.created_at) : ""}</span>
                    <span>{newCount}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="card card-soft">
            <p className="muted" style={{ margin: 0 }}>No additional digests for today yet.</p>
          </div>
        )}
      </section>

      {yesterdayDigests.length > 0 && (
        <section className="home-section">
          <button
            type="button"
            className="recap-open-btn"
            onClick={() => setYesterdayRecapOpen(true)}
          >
            <span className="recap-open-title">Yesterday's Recap</span>
            <span className="recap-open-meta">
              {yesterdayDigests.length} digest{yesterdayDigests.length === 1 ? "" : "s"} combined
            </span>
          </button>
        </section>
      )}

      {selectedDigest && (
        <div
          className="digest-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedDigest(null);
            }
          }}
        >
          <div className="digest-modal-panel" onMouseDown={(event) => event.stopPropagation()}>
            <div className="digest-modal-head">
              <button
                type="button"
                className="btn"
                onClick={() => setSelectedDigest(null)}
                aria-label="Close digest"
              >
                Close
              </button>
            </div>
            <DigestCard digest={selectedDigest} initiallyExpanded />
          </div>
        </div>
      )}

      {yesterdayRecapOpen && (
        <div
          className="digest-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setYesterdayRecapOpen(false);
            }
          }}
        >
          <div className="digest-modal-panel" onMouseDown={(event) => event.stopPropagation()}>
            <div className="digest-modal-head">
              <button
                type="button"
                className="btn"
                onClick={() => setYesterdayRecapOpen(false)}
                aria-label="Close recap"
              >
                Close
              </button>
            </div>

            <article className="card" style={{ margin: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                <h3 className="section-title" style={{ margin: 0 }}>Yesterday's Recap</h3>
                <p className="home-section-meta" style={{ margin: 0 }}>
                  {yesterdayDigests.length} digest{yesterdayDigests.length === 1 ? "" : "s"} merged
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {yesterdayRecapParagraphs.map((paragraph, index) => (
                  <p key={`yesterday-recap-${index}`} className="digest-summary">
                    {paragraph}
                  </p>
                ))}
                {!yesterdayRecapParagraphs.length && (
                  <p className="digest-summary">No recap paragraphs available.</p>
                )}
              </div>
            </article>
          </div>
        </div>
      )}
    </div>
  );
}
