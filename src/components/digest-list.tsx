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

      {filteredDigests.length > 0 ? (
        filteredDigests.map((digest) => (
          <DigestCard key={digest.id} digest={digest} />
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
