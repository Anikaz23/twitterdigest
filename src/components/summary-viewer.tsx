"use client";

import { useMemo, useState } from "react";

const LINES_PER_PAGE = 8;

function normalizeLines(summary: string): string[] {
  return summary
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function SummaryViewer({
  summary,
  createdAt,
  newCount,
}: {
  summary: string;
  createdAt: string;
  newCount: number;
}) {
  const lines = useMemo(() => normalizeLines(summary), [summary]);
  const pages = useMemo(() => {
    const chunks: string[][] = [];
    for (let i = 0; i < lines.length; i += LINES_PER_PAGE)
      chunks.push(lines.slice(i, i + LINES_PER_PAGE));
    return chunks;
  }, [lines]);

  const [pageIndex, setPageIndex] = useState(0);
  const current = pages[pageIndex] ?? [];
  const totalPages = Math.max(1, pages.length);

  return (
    <section className="card summary-card">
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div className="meta-row" style={{ marginBottom: 4 }}>
          <h2 className="section-title">Latest Digest</h2>
          <span
            className="badge"
            style={{
              color: "var(--accent)",
              borderColor: "rgba(var(--accent-rgb), 0.25)",
              background: "var(--accent-dim)",
            }}
          >
            {newCount} tweet{newCount === 1 ? "" : "s"}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
          {formatDate(createdAt)} · {formatTime(createdAt)}
        </p>
      </div>

      {/* Lines */}
      {current.length ? (
        <ol className="summary-lines">
          {current.map((line, idx) => (
            <li key={`${pageIndex}-${idx}`}>{line}</li>
          ))}
        </ol>
      ) : (
        <p style={{ margin: 0, color: "var(--text-2)", fontSize: 14 }}>Nothing to show yet.</p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="summary-controls">
          <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
            {pageIndex + 1} / {totalPages}
          </span>
          <div className="row">
            <button
              className="btn"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
            >
              ← Prev
            </button>
            <button
              className="btn"
              onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              disabled={pageIndex === totalPages - 1}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
