"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ConfigStatus } from "@/lib/types";

interface SetupItem {
  label: string;
  ok: boolean;
  detail: string;
}

function getSetupItems(c: ConfigStatus): SetupItem[] {
  const isExternalWorker = c.ingestion_mode === "external_worker";
  const hasTwitter =
    c.configured.twitter_bearer_token ||
    (c.configured.twitter_api_key &&
      c.configured.twitter_api_secret &&
      c.configured.twitter_access_token &&
      c.configured.twitter_access_token_secret);

  let hasSource: boolean;
  let sourceDetail: string;

  if (isExternalWorker) {
    const hasIp = !!(c.worker_allowed_ip?.trim());
    const hasFirstDigest = c.worker_first_digest_received;
    hasSource = hasIp && hasFirstDigest;
    sourceDetail = !hasIp
      ? "Configure an OpenClaw IP in Settings"
      : !hasFirstDigest
      ? "Waiting for first digest from OpenClaw"
      : "Connected";
  } else {
    hasSource = !!hasTwitter;
    sourceDetail = hasSource
      ? "Configured"
      : "Add a Bearer Token or OAuth 1.0a keys in Settings";
  }

  return [
    {
      label: "Database",
      ok: c.database_connected,
      detail: c.database_connected
        ? "Connected"
        : "Add a DATABASE_URL environment variable to connect your database",
    },
    {
      label: "Digest source",
      ok: hasSource,
      detail: sourceDetail,
    },
  ];
}

function isFullyConfigured(c: ConfigStatus): boolean {
  return getSetupItems(c).every((i) => i.ok);
}

export default function SetupBanner() {
  const pathname = usePathname();
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/config/status")
      .then((r) => r.json())
      .then((data: ConfigStatus) => setConfig(data))
      .catch(() => {});
  }, []);

  if (pathname === "/settings") return null;
  if (!config) return null;
  if (isFullyConfigured(config)) return null;

  const items = getSetupItems(config);
  const doneCount = items.filter((i) => i.ok).length;
  const totalCount = items.length;

  return (
    <div
      style={{
        background: "rgba(245, 158, 11, 0.06)",
        border: "1px solid rgba(245, 158, 11, 0.28)",
        borderLeft: "3px solid #f59e0b",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "13px 18px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          color: "var(--text)",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 15, lineHeight: 1 }}>⚠</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", letterSpacing: "-0.01em" }}>
              Setup required
            </div>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>
              {doneCount} of {totalCount} steps complete — tap to see what&apos;s needed
            </div>
          </div>
        </div>
        <span
          style={{
            fontSize: 18,
            color: "var(--text-3)",
            userSelect: "none",
            lineHeight: 1,
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 180ms ease",
            display: "inline-block",
          }}
        >
          ›
        </span>
      </button>

      {expanded && (
        <div
          style={{
            borderTop: "1px solid rgba(245, 158, 11, 0.14)",
            padding: "14px 18px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {items.map((item) => (
            <div
              key={item.label}
              style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: `2px solid ${item.ok ? "var(--success)" : "#f59e0b"}`,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 1 }}>
                  {item.detail}
                </div>
              </div>
            </div>
          ))}

          <Link
            href="/settings"
            className="btn btn-primary"
            style={{ fontSize: 13, marginTop: 4, width: "fit-content" }}
          >
            Go to Settings →
          </Link>
        </div>
      )}
    </div>
  );
}
