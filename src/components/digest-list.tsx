"use client";

import { type FormEvent, useMemo, useState } from "react";
import DigestCard from "@/components/digest-card";
import type { Digest } from "@/lib/types";

const PAGE_SIZE = 20;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b(\d+)(st|nd|rd|th)\b/g, "$1")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ordinal(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) return "th";
  if (day % 10 === 1) return "st";
  if (day % 10 === 2) return "nd";
  if (day % 10 === 3) return "rd";
  return "th";
}

function parseDigestDate(digest: Digest): Date | null {
  const dateRaw = String(digest.date ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
    const [year, month, day] = dateRaw.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const fromCreated = new Date(digest.created_at);
  if (!Number.isNaN(fromCreated.getTime())) return fromCreated;

  const fromDate = new Date(dateRaw);
  if (!Number.isNaN(fromDate.getTime())) return fromDate;
  return null;
}

function buildDateTokens(digest: Digest): string[] {
  const date = parseDigestDate(digest);
  if (!date) return [digest.date];

  const year = date.getFullYear();
  const monthLong = date.toLocaleString("en-US", { month: "long" });
  const monthShort = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const dayWithOrdinal = `${day}${ordinal(day)}`;

  return [
    `${year}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    `${monthLong} ${day}`,
    `${monthLong} ${dayWithOrdinal}`,
    `${monthLong} ${day}, ${year}`,
    `${monthLong} ${dayWithOrdinal}, ${year}`,
    `${monthShort} ${day}`,
    `${monthShort} ${dayWithOrdinal}`,
    `${monthShort} ${day}, ${year}`,
    `${monthShort} ${dayWithOrdinal}, ${year}`,
  ];
}

function matchesDigestSearch(digest: Digest, rawQuery: string): boolean {
  const query = normalize(rawQuery);
  if (!query) return true;

  const dateTokens = buildDateTokens(digest);
  const haystack = [
    ...dateTokens,
    digest.date,
    digest.title,
    digest.summary,
    ...(Array.isArray(digest.topics) ? digest.topics : []),
  ]
    .map((item) => String(item ?? ""))
    .join("\n")
    .toLowerCase();

  return haystack.includes(query);
}

function formatSearchDate(digest: Digest): string {
  const date = parseDigestDate(digest);
  if (!date) return digest.date;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function dayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function groupLabel(date: Date, now: Date): string {
  const today = dayStart(now).getTime();
  const target = dayStart(date).getTime();
  const diff = Math.round((today - target) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

interface HistoryGroup {
  key: string;
  label: string;
  sortKey: number;
  digests: Digest[];
}

export default function DigestList({
  initialDigests,
  initialHasMore,
}: {
  initialDigests: Digest[];
  initialHasMore: boolean;
}) {
  const [digests, setDigests] = useState(initialDigests);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(initialDigests.length);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredDigests = useMemo(
    () => digests.filter((digest) => matchesDigestSearch(digest, query)),
    [digests, query]
  );
  const groupedDigests = useMemo(() => {
    const byDay = new Map<string, HistoryGroup>();
    const now = new Date();
    const sorted = [...filteredDigests].sort((a, b) => {
      const left = parseDigestDate(a);
      const right = parseDigestDate(b);
      const leftTime = left ? left.getTime() : 0;
      const rightTime = right ? right.getTime() : 0;
      return rightTime - leftTime;
    });

    for (const digest of sorted) {
      const parsed = parseDigestDate(digest);
      if (!parsed) {
        const unknown = byDay.get("unknown");
        if (unknown) {
          unknown.digests.push(digest);
        } else {
          byDay.set("unknown", {
            key: "unknown",
            label: "Unknown Date",
            sortKey: -1,
            digests: [digest],
          });
        }
        continue;
      }

      const start = dayStart(parsed);
      const key = dayKey(start);
      const existing = byDay.get(key);

      if (existing) {
        existing.digests.push(digest);
        continue;
      }

      byDay.set(key, {
        key,
        label: groupLabel(start, now),
        sortKey: start.getTime(),
        digests: [digest],
      });
    }

    return [...byDay.values()].sort((a, b) => b.sortKey - a.sortKey);
  }, [filteredDigests]);
  const dropdownMatches = useMemo(() => {
    if (!draftQuery.trim()) return [];
    return digests.filter((digest) => matchesDigestSearch(digest, draftQuery)).slice(0, 6);
  }, [digests, draftQuery]);
  const showSubmit = draftQuery.trim().length > 0 && draftQuery.trim() !== query;
  const showDropdown = searchFocused && draftQuery.trim().length > 0;

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/digests?offset=${offset}&limit=${PAGE_SIZE}`);
      const data = await res.json();
      setDigests((prev) => [...prev, ...(data.digests ?? [])]);
      setHasMore(Boolean(data.pagination?.hasMore));
      setOffset((prev) => prev + (data.digests?.length ?? 0));
    } finally {
      setLoading(false);
    }
  }

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(draftQuery.trim());
  }

  function applySuggestion(digest: Digest) {
    setDraftQuery(digest.title);
    setQuery(digest.title);
    setSearchFocused(false);
  }

  if (!digests.length) {
    return (
      <div className="card card-soft">
        <p className="muted" style={{ margin: 0 }}>
          No digests yet.
        </p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <form className="history-search-form" onSubmit={applySearch}>
        <label style={{ display: "block" }}>
          <input
            className="field history-search-input"
            type="text"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search by date or event (e.g. February 23rd, product launch)"
            aria-label="Search history digests"
          />
        </label>
        {showSubmit && (
          <button type="submit" className="history-search-submit" aria-label="Apply search">
            ↵
          </button>
        )}
        {showDropdown && (
          <div className="history-search-dropdown" role="listbox" aria-label="History search results">
            {dropdownMatches.length > 0 ? (
              dropdownMatches.map((digest) => (
                <button
                  key={digest.id}
                  type="button"
                  className="history-search-item"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    applySuggestion(digest);
                  }}
                >
                  <span className="history-search-item-title">{digest.title}</span>
                  <span className="history-search-item-meta">{formatSearchDate(digest)}</span>
                </button>
              ))
            ) : (
              <p className="history-search-empty">No matching digests.</p>
            )}
          </div>
        )}
      </form>

      {groupedDigests.length > 0 ? (
        groupedDigests.map((group) => (
          <section key={group.key} className="history-group">
            <h3 className="history-group-title">{group.label}</h3>
            <div className="history-group-list">
              {group.digests.map((digest) => (
                <DigestCard key={digest.id} digest={digest} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="card card-soft">
          <p className="muted" style={{ margin: 0 }}>
            No results. Try a date like <span className="mono">February 23rd</span> or a keyword from the event title.
          </p>
        </div>
      )}

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 2 }}>
          <button className="btn" onClick={loadMore} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
