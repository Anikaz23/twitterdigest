"use client";

import { useState, useEffect } from "react";
import type { ConfigStatus } from "@/lib/types";

// ── helpers ───────────────────────────────────────────────────────────────────

function isSourceConnected(
  mode: string,
  c: ConfigStatus["configured"],
): boolean {
  if (mode === "bearer_token") return c.twitter_bearer_token;
  return (
    c.twitter_api_key &&
    c.twitter_api_secret &&
    c.twitter_access_token &&
    c.twitter_access_token_secret
  );
}

function isSummarizerConnected(
  provider: string,
  c: ConfigStatus["configured"],
): boolean {
  if (provider === "openai") return c.openai_api_key;
  if (provider === "anthropic") return c.anthropic_api_key;
  return c.openai_api_key || c.anthropic_api_key;
}

function encodeSegment(value: string): string {
  return encodeURIComponent(value);
}

function addQuery(base: string, query: string): string {
  if (!query) return base;
  return `${base}${base.includes("?") ? "&" : "?"}${query}`;
}

// ── tiny sub-components ───────────────────────────────────────────────────────

type PillTone = "neutral" | "info" | "success" | "warning";

function pillColors(tone: PillTone) {
  if (tone === "success") {
    return {
      border: "rgba(50, 215, 75, 0.35)",
      background: "rgba(50, 215, 75, 0.12)",
      color: "#32d74b",
    };
  }
  if (tone === "warning") {
    return {
      border: "rgba(255, 69, 58, 0.45)",
      background: "rgba(255, 69, 58, 0.12)",
      color: "var(--danger)",
    };
  }
  if (tone === "info") {
    return {
      border: "rgba(var(--accent-rgb),0.28)",
      background: "var(--accent-dim)",
      color: "var(--accent)",
    };
  }
  return {
    border: "var(--border)",
    background: "transparent",
    color: "var(--text-3)",
  };
}

function StatusPill({
  on,
  label,
  tone,
}: {
  on: boolean;
  label?: string;
  tone?: PillTone;
}) {
  const resolvedTone = tone ?? (on ? "info" : "warning");
  const colors = pillColors(resolvedTone);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 999,
        border: `1px solid ${colors.border}`,
        background: colors.background,
        color: colors.color,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "currentColor",
          flexShrink: 0,
        }}
      />
      {label ?? (on ? "Connected" : "Not configured")}
    </span>
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: 12,
        cursor: "pointer",
        border: `1px solid ${selected ? "rgba(var(--accent-rgb),0.45)" : "var(--border)"}`,
        background: selected ? "var(--accent-dim)" : "var(--surface-2)",
        color: "var(--text)",
        transition: "border-color 150ms, background 150ms",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
        {/* Twitter-style radio: outer ring always visible, inner dot appears when selected */}
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: `2px solid ${selected ? "var(--accent)" : "var(--border-strong)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "border-color 150ms",
          }}
        >
          {selected && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--accent)",
                transition: "background 150ms",
              }}
            />
          )}
        </span>
      </div>
      <span style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.4 }}>
        {desc}
      </span>
    </button>
  );
}

function SecretField({
  label,
  name,
  value,
  isSaved,
  onChange,
  invalid,
  locked,
  onUnlockRequest,
}: {
  label: string;
  name: string;
  value: string;
  isSaved: boolean;
  onChange: (v: string) => void;
  invalid?: boolean;
  locked?: boolean;
  onUnlockRequest?: () => void;
}) {
  const [visible, setVisible] = useState(false);

  // Locked: show a clickable masked field that opens the unlock modal on click
  if (locked) {
    return (
      <label className="settings-label">
        <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {label}
          {isSaved && (
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
              SAVED
            </span>
          )}
        </span>
        <div
          className="field"
          role="button"
          tabIndex={0}
          onClick={onUnlockRequest}
          onKeyDown={(e) => e.key === "Enter" && onUnlockRequest?.()}
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            color: isSaved ? "var(--text-3)" : "var(--text-4, var(--text-3))",
            userSelect: "none",
          }}
          title="Click to unlock and edit"
        >
          {isSaved ? "•••••••••••••••••" : <span style={{ fontStyle: "italic", fontSize: 12 }}>Click to unlock</span>}
        </div>
      </label>
    );
  }

  return (
    <label className="settings-label">
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {label}
        {isSaved && !value && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "var(--accent)",
              fontFamily: "var(--font-mono)",
            }}
          >
            SAVED
          </span>
        )}
      </span>
      <div style={{ position: "relative" }}>
        <input
          className="field"
          type={visible ? "text" : "password"}
          name={name}
          placeholder="Paste here…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            paddingRight: 48,
            ...(invalid && !isSaved && !value
              ? { borderColor: "var(--danger)" }
              : {}),
          }}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "var(--text-3)",
            cursor: "pointer",
            fontSize: 11,
            padding: 0,
          }}
        >
          {visible ? "hide" : "show"}
        </button>
      </div>
    </label>
  );
}

function SetupHint({
  title,
  description,
  linkHref,
  linkLabel,
  onLinkClick,
}: {
  title: string;
  description: string;
  linkHref: string;
  linkLabel: string;
  onLinkClick?: () => void;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface-2)",
        borderRadius: 10,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 700,
          color: "var(--text)",
        }}
      >
        {title}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: "var(--text-2)",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      <a
        href={linkHref}
        target="_blank"
        rel="noreferrer"
        onClick={() => onLinkClick?.()}
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--accent)",
          textDecoration: "underline",
          width: "fit-content",
        }}
      >
        {linkLabel}
      </a>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  pill,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle: string;
  pill: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "16px 20px",
          background: "none",
          border: "none",
          color: "var(--text)",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span
            style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em" }}
          >
            {title}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>
            {subtitle}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          {pill}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            style={{
              color: "var(--text-3)",
              transition: "transform 200ms",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <path
              d="M2.5 5L7 9.5L11.5 5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {/* Body */}
      {open && (
        <div
          style={{
            padding: "0 20px 20px",
            borderTop: "1px solid var(--border)",
            paddingTop: 18,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function SubSection({
  title,
  subtitle,
  open,
  onToggle,
  pill,
  children,
}: {
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  pill?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--surface-2)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          border: "none",
          background: "none",
          cursor: "pointer",
          color: "var(--text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          textAlign: "left",
          padding: "12px 14px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>
            {subtitle}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {pill}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            style={{
              color: "var(--text-3)",
              transition: "transform 200ms",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <path
              d="M2.5 5L7 9.5L11.5 5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {open && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "12px 14px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export default function SettingsForm({
  initial,
  onStatusChange,
  revealedValues,
  onUnlockRequest,
}: {
  initial: ConfigStatus;
  onStatusChange?: (s: ConfigStatus) => void;
  revealedValues?: Record<string, string>;
  onUnlockRequest?: () => void;
}) {
  const locked = !revealedValues;
  const [status, setStatus] = useState<ConfigStatus>(initial);

  function applyStatus(s: ConfigStatus) {
    setStatus(s);
    onStatusChange?.(s);
  }
  const [fields, setFields] = useState<Record<string, string>>({});

  // When credentials are revealed, seed the fields state with actual values
  useEffect(() => {
    if (revealedValues) {
      const extra: Record<string, string> = {};
      // Parse database_url into provider-specific fields so host/user/password fill in
      if (revealedValues.database_url) {
        try {
          const u = new URL(revealedValues.database_url);
          extra.neon_host = u.hostname;
          extra.neon_user = decodeURIComponent(u.username);
          extra.neon_password = decodeURIComponent(u.password);
          extra.neon_database = decodeURIComponent(u.pathname.slice(1));
          extra.supabase_host = u.hostname + (u.port ? `:${u.port}` : "");
          extra.supabase_user = decodeURIComponent(u.username);
          extra.supabase_password = decodeURIComponent(u.password);
          extra.supabase_database = decodeURIComponent(u.pathname.slice(1));
        } catch {}
      }
      setFields((prev) => ({ ...prev, ...revealedValues, ...extra }));
    }
  }, [revealedValues]);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [twitterAuthOpen, setTwitterAuthOpen] = useState(false);
  const [twitterSummarizerOpen, setTwitterSummarizerOpen] = useState(false);
  const [databaseOpen, setDatabaseOpen] = useState(false);
  const [sourceSaving, setSourceSaving] = useState(false);
  const [databaseSaving, setDatabaseSaving] = useState(false);
  const [sourceMsg, setSourceMsg] = useState("");
  const [databaseMsg, setDatabaseMsg] = useState("");
  const [showOpenAiSteps, setShowOpenAiSteps] = useState(false);
  const [showAnthropicSteps, setShowAnthropicSteps] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [userInputMode, setUserInputMode] = useState<"id" | "username">(() =>
    initial.twitter_user_id ? "id" : "username",
  );

  // Derived active values
  const ingestionMode =
    fields.ingestion_mode ?? status.ingestion_mode ?? "twitter_api";
  const twitterMode =
    fields.twitter_mode ?? status.twitter_mode ?? "bearer_token";
  const twitterPullModeRaw =
    fields.twitter_pull_mode ?? status.twitter_pull_mode ?? "user_timeline";
  const twitterPullMode =
    twitterMode === "bearer_token" && twitterPullModeRaw === "home_timeline"
      ? "user_timeline"
      : twitterPullModeRaw;
  const twitterModeLabel =
    twitterMode === "bearer_token" ? "Bearer Token" : "OAuth 1.0a";
  const twitterPullModeLabel =
    twitterPullMode === "home_timeline"
      ? "Home timeline"
      : twitterPullMode === "search_query"
        ? "Search query"
        : "User timeline";
  const summarizerProvider =
    fields.summarizer_provider ?? status.summarizer_provider ?? "auto";
  const workerAllowedIp =
    fields.worker_allowed_ip ?? status.worker_allowed_ip ?? "";
  const workerConfigured = Boolean(workerAllowedIp.trim());
  const workerFirstDigestReceived = Boolean(
    status.worker_first_digest_received,
  );
  const workerConnected = workerConfigured && workerFirstDigestReceived;
  const workerWaiting = workerConfigured && !workerFirstDigestReceived;
  const databaseProviderRaw =
    fields.database_provider ?? status.database_provider ?? "other";
  const databaseProvider =
    databaseProviderRaw === "neon" ||
    databaseProviderRaw === "supabase" ||
    databaseProviderRaw === "other"
      ? databaseProviderRaw
      : "other";
  const databaseLabel = fields.database_label ?? status.database_label ?? "";
  const databaseUrlInput = (fields.database_url ?? "").trim();
  const neonHost = (fields.neon_host ?? "").trim();
  const neonDatabaseInput = (fields.neon_database ?? "").trim();
  const neonUserInput = (fields.neon_user ?? "").trim();
  const neonDatabase = neonDatabaseInput || "neondb";
  const neonUser = neonUserInput || "neondb_owner";
  const neonPassword = (fields.neon_password ?? "").trim();
  const supabaseHost = (fields.supabase_host ?? "").trim();
  const supabasePortInput = (fields.supabase_port ?? "").trim();
  const supabaseDatabaseInput = (fields.supabase_database ?? "").trim();
  const supabaseUserInput = (fields.supabase_user ?? "").trim();
  const supabasePort = supabasePortInput || "5432";
  const supabaseDatabase = supabaseDatabaseInput || "postgres";
  const supabaseUser = supabaseUserInput || "postgres";
  const supabasePassword = (fields.supabase_password ?? "").trim();
  const hasNeonInput =
    Boolean(neonHost) || Boolean(neonDatabaseInput) || Boolean(neonUserInput) || Boolean(neonPassword);
  const hasSupabaseInput =
    Boolean(supabaseHost) || Boolean(supabasePortInput) || Boolean(supabaseDatabaseInput) || Boolean(supabaseUserInput) || Boolean(supabasePassword);
  const c = status.configured;
  const userPullMissing =
    twitterPullMode === "user_timeline" &&
    !(
      (fields.twitter_user_id ?? status.twitter_user_id ?? "").trim() ||
      (fields.twitter_username ?? status.twitter_username ?? "").trim()
    );
  const queryPullMissing =
    twitterPullMode === "search_query" &&
    !(fields.twitter_query ?? status.twitter_query ?? "").trim();
  const homeModeNeedsOauth =
    twitterPullMode === "home_timeline" && twitterMode !== "oauth1a";
  const sourceConnected =
    ingestionMode === "twitter_api"
      ? isSourceConnected(twitterMode, c) &&
        !homeModeNeedsOauth &&
        !userPullMissing &&
        !queryPullMissing
      : workerConnected;
  const hasBearerToken =
    Boolean((fields.twitter_bearer_token ?? "").trim()) ||
    c.twitter_bearer_token;
  const hasTwitterApiKey =
    Boolean((fields.twitter_api_key ?? "").trim()) || c.twitter_api_key;
  const hasTwitterApiSecret =
    Boolean((fields.twitter_api_secret ?? "").trim()) || c.twitter_api_secret;
  const hasTwitterAccessToken =
    Boolean((fields.twitter_access_token ?? "").trim()) ||
    c.twitter_access_token;
  const hasTwitterAccessTokenSecret =
    Boolean((fields.twitter_access_token_secret ?? "").trim()) ||
    c.twitter_access_token_secret;
  const missingOauthKeys = [
    !hasTwitterApiKey ? "API key" : null,
    !hasTwitterApiSecret ? "API secret" : null,
    !hasTwitterAccessToken ? "access token" : null,
    !hasTwitterAccessTokenSecret ? "access token secret" : null,
  ].filter((v): v is string => Boolean(v));
  const summarizerConnected = isSummarizerConnected(summarizerProvider, c);
  const hasOpenAiKey =
    Boolean((fields.openai_api_key ?? "").trim()) || c.openai_api_key;
  const hasAnthropicKey =
    Boolean((fields.anthropic_api_key ?? "").trim()) || c.anthropic_api_key;
  const summarizerIssue =
    (summarizerProvider === "openai" && !hasOpenAiKey) ||
    (summarizerProvider === "anthropic" && !hasAnthropicKey);
  const twitterAuthMissing =
    ingestionMode === "twitter_api" && !isSourceConnected(twitterMode, c);
  const databaseConnected = status.database_connected;
  const databaseIssue =
    (databaseConnected && !status.database_host) ||
    (databaseMsg.length > 0 && databaseMsg !== "Saved.");
  const databaseTone: PillTone = !databaseConnected
    ? "warning"
    : databaseIssue
      ? "warning"
      : "success";
  const databaseLabelText = !databaseConnected
    ? "Not connected"
    : databaseIssue
      ? "Issue"
      : "Connected";
  const openaiMissing = summarizerProvider === "openai" && !c.openai_api_key;
  const anthropicMissing =
    summarizerProvider === "anthropic" && !c.anthropic_api_key;
  const autoMissingBoth =
    summarizerProvider === "auto" && !c.openai_api_key && !c.anthropic_api_key;
  const twitterSourceSubtitle = sourceConnected
    ? `Twitter API · Connected · ${twitterModeLabel} · ${twitterPullModeLabel}`
    : homeModeNeedsOauth
      ? "Twitter API · Home timeline needs OAuth 1.0a credentials"
      : twitterMode === "bearer_token" && !hasBearerToken
        ? "Twitter API · Waiting for Bearer token"
        : twitterMode === "oauth1a" && missingOauthKeys.length === 1
          ? `Twitter API · Waiting for ${missingOauthKeys[0]}`
          : twitterMode === "oauth1a" && missingOauthKeys.length > 1
            ? `Twitter API · Waiting for OAuth keys (${missingOauthKeys.length} missing)`
            : userPullMissing
              ? "Twitter API · Waiting for user ID or username"
              : queryPullMissing
                ? "Twitter API · Waiting for search query"
                : `Twitter API · ${twitterModeLabel} · ${twitterPullModeLabel}`;
  const sourceSubtitle =
    ingestionMode === "twitter_api"
      ? twitterSourceSubtitle
      : !workerConfigured
        ? "OpenClaw · Connection not configured"
        : workerConnected
          ? `OpenClaw · Allowed IP ${workerAllowedIp}`
          : "OpenClaw · Waiting for first digest from OpenClaw";
  const sourcePill =
    ingestionMode === "twitter_api" ? (
      <StatusPill
        on={sourceConnected}
        tone={sourceConnected ? "success" : "warning"}
      />
    ) : workerConnected ? (
      <StatusPill on label="Connected" tone="success" />
    ) : workerWaiting ? (
      <StatusPill on={false} label="Waiting" tone="info" />
    ) : (
      <StatusPill on={false} label="Closed" tone="warning" />
    );

  function set(name: string, value: string) {
    setFields((prev) => ({ ...prev, [name]: value }));
  }

  function resolveDatabaseUrlFromInputs(): { url: string | null; error?: string } {
    if (databaseProvider === "neon") {
      if (!hasNeonInput && !databaseUrlInput) return { url: null };
      if (databaseUrlInput) return { url: databaseUrlInput };
      if (!neonHost || !neonDatabase || !neonUser || !neonPassword) {
        return { url: null, error: "Fill Neon host, database, user, and password." };
      }
      const base = `postgresql://${encodeSegment(neonUser)}:${encodeSegment(neonPassword)}@${neonHost}/${encodeSegment(neonDatabase)}`;
      return { url: addQuery(base, "sslmode=require&channel_binding=require") };
    }

    if (databaseProvider === "supabase") {
      if (!hasSupabaseInput && !databaseUrlInput) return { url: null };
      if (databaseUrlInput) return { url: databaseUrlInput };
      if (!supabaseHost || !supabaseDatabase || !supabaseUser || !supabasePassword) {
        return { url: null, error: "Fill Supabase host, database, user, and password." };
      }
      const hostWithPort = supabaseHost.includes(":")
        ? supabaseHost
        : `${supabaseHost}:${supabasePort || "5432"}`;
      const base = `postgresql://${encodeSegment(supabaseUser)}:${encodeSegment(supabasePassword)}@${hostWithPort}/${encodeSegment(supabaseDatabase)}`;
      return { url: addQuery(base, "sslmode=require") };
    }

    if (!databaseUrlInput) return { url: null };
    return { url: databaseUrlInput };
  }

  async function saveSource() {
    setSourceSaving(true);
    setSourceMsg("");

    if (ingestionMode === "twitter_api") {
      const hasErrors =
        homeModeNeedsOauth ||
        userPullMissing ||
        queryPullMissing ||
        autoMissingBoth ||
        (summarizerProvider === "openai" && !hasOpenAiKey) ||
        (summarizerProvider === "anthropic" && !hasAnthropicKey);
      if (hasErrors) {
        setShowValidationErrors(true);
        setSourceMsg(
          autoMissingBoth
            ? "Add OpenAI or Anthropic key for auto summarizer."
            : "Fill in required fields.",
        );
        setSourceSaving(false);
        return;
      }
    }

    try {
      const payload: Record<string, string | number> = {
        ingestion_mode: ingestionMode,
        twitter_mode: twitterMode,
        twitter_pull_mode: twitterPullMode,
        summarizer_provider: summarizerProvider,
        worker_allowed_ip: workerAllowedIp,
        twitter_user_id: fields.twitter_user_id ?? status.twitter_user_id ?? "",
        twitter_username:
          fields.twitter_username ?? status.twitter_username ?? "",
        twitter_query: fields.twitter_query ?? status.twitter_query ?? "",
        twitter_max_results:
          fields.twitter_max_results ??
          String(status.twitter_max_results ?? 100),
      };
      // Only include credential keys if the user typed something
      const credKeys = [
        "twitter_bearer_token",
        "twitter_api_key",
        "twitter_api_secret",
        "twitter_access_token",
        "twitter_access_token_secret",
        "openai_api_key",
        "anthropic_api_key",
      ] as const;
      for (const k of credKeys) {
        if (Object.prototype.hasOwnProperty.call(fields, k)) {
          payload[k] = fields[k] ?? "";
        }
      }

      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setSourceMsg(data.error || "Failed to save.");
        return;
      }

      applyStatus(data as ConfigStatus);
      setFields((prev) => {
        const next = { ...prev };
        for (const k of [
          ...credKeys,
          "twitter_user_id",
          "twitter_username",
          "twitter_query",
          "twitter_max_results",
          "ingestion_mode",
          "twitter_mode",
          "twitter_pull_mode",
          "summarizer_provider",
          "worker_allowed_ip",
        ])
          delete next[k];
        return next;
      });
      setSourceMsg("Saved.");
      setSourceOpen(false);
      setTwitterAuthOpen(false);
      setTwitterSummarizerOpen(false);
    } catch (e: any) {
      setSourceMsg(e?.message || "Error.");
    } finally {
      setSourceSaving(false);
    }
  }

  async function saveDatabase() {
    setDatabaseSaving(true);
    setDatabaseMsg("");
    try {
      const resolvedDatabaseUrl = resolveDatabaseUrlFromInputs();
      const shouldConnect = Boolean(resolvedDatabaseUrl.url);

      if (!databaseConnected && !shouldConnect) {
        setDatabaseMsg(
          databaseProvider === "neon"
            ? "Enter Neon connection fields first."
            : databaseProvider === "supabase"
              ? "Enter Supabase connection fields first."
              : "Enter Database URL first.",
        );
        return;
      }

      if (resolvedDatabaseUrl.error) {
        setDatabaseMsg(resolvedDatabaseUrl.error);
        return;
      }

      if (shouldConnect && resolvedDatabaseUrl.url) {
        const connectRes = await fetch("/api/config/database-url", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ database_url: resolvedDatabaseUrl.url }),
        });
        const connectData = await connectRes.json();
        if (!connectRes.ok) {
          setDatabaseMsg(connectData.error || "Failed to connect database.");
          return;
        }
        applyStatus(connectData as ConfigStatus);
      }

      const payload = {
        database_provider: databaseProvider,
        database_label: databaseLabel,
      };
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setDatabaseMsg(data.error || "Failed to save.");
        return;
      }

      applyStatus(data as ConfigStatus);
      setFields((prev) => {
        const next = { ...prev };
        delete next.database_provider;
        delete next.database_label;
        delete next.database_url;
        delete next.neon_host;
        delete next.neon_database;
        delete next.neon_user;
        delete next.neon_password;
        delete next.supabase_host;
        delete next.supabase_port;
        delete next.supabase_database;
        delete next.supabase_user;
        delete next.supabase_password;
        return next;
      });
      setDatabaseMsg("Saved.");
      setDatabaseOpen(false);
    } catch (e: any) {
      setDatabaseMsg(e?.message || "Error.");
    } finally {
      setDatabaseSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* ── Digest Source ───────────────────────────────────────────────── */}
      <SectionCard
        title="Digest Source"
        subtitle={sourceSubtitle}
        pill={sourcePill}
        open={sourceOpen}
        onToggle={() =>
          setSourceOpen((v) => {
            const next = !v;
            if (next) {
              setTwitterAuthOpen(false);
              setTwitterSummarizerOpen(false);
            }
            return next;
          })
        }
      >
        {/* Step 1: mode */}
        <div>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-3)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Source
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <OptionCard
              selected={ingestionMode === "twitter_api"}
              onClick={() => set("ingestion_mode", "twitter_api")}
              title="Twitter API"
              desc="Fetch tweets directly through the X API."
            />
            <OptionCard
              selected={ingestionMode === "external_worker"}
              onClick={() => set("ingestion_mode", "external_worker")}
              title="OpenClaw"
              desc="Browser-based ingestion via the OpenClaw agent."
            />
          </div>
        </div>

        {/* Step 2: Twitter API sub-options */}
        {ingestionMode === "twitter_api" && (
          <>
            <SubSection
              title="Twitter Auth"
              subtitle={`${twitterMode === "bearer_token" ? "Bearer Token" : "OAuth 1.0a"} · ${twitterPullMode === "home_timeline" ? "Home timeline" : twitterPullMode === "search_query" ? "Search query" : "User timeline"}`}
              open={twitterAuthOpen}
              onToggle={() => setTwitterAuthOpen((v) => !v)}
              pill={
                <StatusPill
                  on={
                    !twitterAuthMissing &&
                    !homeModeNeedsOauth &&
                    !userPullMissing &&
                    !queryPullMissing
                  }
                  label={
                    !twitterAuthMissing &&
                    !homeModeNeedsOauth &&
                    !userPullMissing &&
                    !queryPullMissing
                      ? "Configured"
                      : "Missing"
                  }
                  tone={
                    !twitterAuthMissing &&
                    !homeModeNeedsOauth &&
                    !userPullMissing &&
                    !queryPullMissing
                      ? "success"
                      : "warning"
                  }
                />
              }
            >
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-3)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Access Mode
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <OptionCard
                  selected={twitterMode === "bearer_token"}
                  onClick={() => {
                    set("twitter_mode", "bearer_token");
                    if (twitterPullMode === "home_timeline") {
                      set("twitter_pull_mode", "user_timeline");
                    }
                  }}
                  title="Bearer Token"
                  desc="Read-only access. Simplest setup."
                />
                <OptionCard
                  selected={twitterMode === "oauth1a"}
                  onClick={() => set("twitter_mode", "oauth1a")}
                  title="OAuth 1.0a"
                  desc="Full user context — required for home timeline."
                />
              </div>

              {twitterAuthMissing && (
                <SetupHint
                  title="Twitter auth is not configured yet"
                  description={
                    twitterMode === "bearer_token"
                      ? "Create a read-only app in the X Developer Portal, copy the Bearer Token, then save it here."
                      : "Create app credentials in the X Developer Portal and paste API key/secret + access token/secret."
                  }
                  linkHref="https://developer.x.com/en/portal/dashboard"
                  linkLabel="Open X Developer Portal"
                />
              )}

              {/* Credentials for selected mode */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-3)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Credentials
                </p>

                {twitterMode === "bearer_token" && (
                  <SecretField
                    label="Bearer Token"
                    name="twitter_bearer_token"
                    value={fields.twitter_bearer_token ?? ""}
                    isSaved={c.twitter_bearer_token}
                    onChange={(v) => set("twitter_bearer_token", v)}
                    invalid={showValidationErrors}
                    locked={locked}
                    onUnlockRequest={onUnlockRequest}
                  />
                )}

                {twitterMode === "oauth1a" && (
                  <>
                    <SecretField
                      label="API Key"
                      name="twitter_api_key"
                      value={fields.twitter_api_key ?? ""}
                      isSaved={c.twitter_api_key}
                      onChange={(v) => set("twitter_api_key", v)}
                      invalid={showValidationErrors}
                      locked={locked}
                      onUnlockRequest={onUnlockRequest}
                    />
                    <SecretField
                      label="API Secret"
                      name="twitter_api_secret"
                      value={fields.twitter_api_secret ?? ""}
                      isSaved={c.twitter_api_secret}
                      onChange={(v) => set("twitter_api_secret", v)}
                      invalid={showValidationErrors}
                      locked={locked}
                      onUnlockRequest={onUnlockRequest}
                    />
                    <SecretField
                      label="Access Token"
                      name="twitter_access_token"
                      value={fields.twitter_access_token ?? ""}
                      isSaved={c.twitter_access_token}
                      onChange={(v) => set("twitter_access_token", v)}
                      invalid={showValidationErrors}
                      locked={locked}
                      onUnlockRequest={onUnlockRequest}
                    />
                    <SecretField
                      label="Access Token Secret"
                      name="twitter_access_token_secret"
                      value={fields.twitter_access_token_secret ?? ""}
                      isSaved={c.twitter_access_token_secret}
                      onChange={(v) => set("twitter_access_token_secret", v)}
                      invalid={showValidationErrors}
                      locked={locked}
                      onUnlockRequest={onUnlockRequest}
                    />
                  </>
                )}
              </div>

              {/* Pull target */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-3)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  What To Pull
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {twitterMode === "oauth1a" && (
                    <OptionCard
                      selected={twitterPullMode === "home_timeline"}
                      onClick={() => set("twitter_pull_mode", "home_timeline")}
                      title="Home Timeline"
                      desc="Pull tweets from your own home timeline."
                    />
                  )}
                  <OptionCard
                    selected={twitterPullMode === "user_timeline"}
                    onClick={() => set("twitter_pull_mode", "user_timeline")}
                    title="Specific User"
                    desc="Pull tweets from one target user."
                  />
                  <OptionCard
                    selected={twitterPullMode === "search_query"}
                    onClick={() => set("twitter_pull_mode", "search_query")}
                    title="Search Query"
                    desc="Pull tweets by query expression."
                  />
                </div>

                {twitterPullMode === "home_timeline" && (
                  <>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "var(--text-2)",
                      }}
                    >
                      No user ID, username, or query is required for home
                      timeline.
                    </p>
                    {homeModeNeedsOauth && (
                      <SetupHint
                        title="Home timeline needs OAuth 1.0a"
                        description="Switch Access Mode above to OAuth 1.0a, then add API key/secret and access token/secret."
                        linkHref="https://developer.x.com/en/docs/authentication/oauth-1-0a"
                        linkLabel="Read OAuth 1.0a setup"
                      />
                    )}
                  </>
                )}

                {twitterPullMode === "user_timeline" && (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {/* Vertical toggle: User ID / Username */}
                    <div
                      style={{
                        border: `1px solid ${showValidationErrors && userPullMissing ? "var(--danger)" : "var(--border)"}`,
                        borderRadius: 10,
                        overflow: "hidden",
                        transition: "border-color 150ms",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setUserInputMode("id")}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 12px",
                          border: "none",
                          borderBottom: "1px solid var(--border)",
                          background:
                            userInputMode === "id"
                              ? "var(--accent-dim)"
                              : "var(--surface-2)",
                          color: "var(--text)",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 150ms",
                        }}
                      >
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            flexShrink: 0,
                            border: `2px solid ${userInputMode === "id" ? "var(--accent)" : "var(--border-strong)"}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "border-color 150ms",
                          }}
                        >
                          {userInputMode === "id" && (
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "var(--accent)",
                              }}
                            />
                          )}
                        </span>
                        <svg
                          viewBox="0 0 16 16"
                          width="13"
                          height="13"
                          fill={
                            userInputMode === "id"
                              ? "var(--accent)"
                              : "var(--text-3)"
                          }
                          aria-hidden="true"
                          style={{ flexShrink: 0 }}
                        >
                          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 14s-1 0-1-1 1-4 7-4 7 3 7 4-1 1-1 1H2Z" />
                        </svg>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color:
                              userInputMode === "id"
                                ? "var(--text)"
                                : "var(--text-2)",
                          }}
                        >
                          User ID
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserInputMode("username")}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 12px",
                          border: "none",
                          background:
                            userInputMode === "username"
                              ? "var(--accent-dim)"
                              : "var(--surface-2)",
                          color: "var(--text)",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 150ms",
                        }}
                      >
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            flexShrink: 0,
                            border: `2px solid ${userInputMode === "username" ? "var(--accent)" : "var(--border-strong)"}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "border-color 150ms",
                          }}
                        >
                          {userInputMode === "username" && (
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "var(--accent)",
                              }}
                            />
                          )}
                        </span>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            lineHeight: 1,
                            flexShrink: 0,
                            color:
                              userInputMode === "username"
                                ? "var(--accent)"
                                : "var(--text-3)",
                          }}
                        >
                          @
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color:
                              userInputMode === "username"
                                ? "var(--text)"
                                : "var(--text-2)",
                          }}
                        >
                          Username
                        </span>
                      </button>
                    </div>
                    {/* Input for selected mode */}
                    <input
                      className="field"
                      value={
                        userInputMode === "id"
                          ? (fields.twitter_user_id ??
                            status.twitter_user_id ??
                            "")
                          : (fields.twitter_username ??
                            status.twitter_username ??
                            "")
                      }
                      onChange={(e) =>
                        userInputMode === "id"
                          ? set("twitter_user_id", e.target.value)
                          : set("twitter_username", e.target.value)
                      }
                      placeholder={
                        userInputMode === "id" ? "e.g. 12345678" : "@handle"
                      }
                      style={
                        showValidationErrors && userPullMissing
                          ? { borderColor: "var(--danger)" }
                          : {}
                      }
                    />
                  </div>
                )}

                {twitterPullMode === "search_query" && (
                  <label className="settings-label">
                    Search Query
                    <input
                      className="field"
                      value={fields.twitter_query ?? status.twitter_query ?? ""}
                      onChange={(e) => set("twitter_query", e.target.value)}
                      placeholder="from:user OR #topic"
                      style={
                        showValidationErrors && queryPullMissing
                          ? { borderColor: "var(--danger)" }
                          : {}
                      }
                    />
                  </label>
                )}

                <label className="settings-label">
                  Max results per run
                  <input
                    className="field"
                    type="number"
                    min={10}
                    max={100}
                    value={
                      fields.twitter_max_results ??
                      String(status.twitter_max_results ?? 100)
                    }
                    onChange={(e) => set("twitter_max_results", e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                </label>
              </div>
            </SubSection>

            <SubSection
              title="Summarizer"
              subtitle={
                summarizerProvider === "auto"
                  ? "Auto provider selection"
                  : summarizerProvider === "openai"
                    ? "OpenAI"
                    : "Anthropic"
              }
              open={twitterSummarizerOpen}
              onToggle={() => setTwitterSummarizerOpen((v) => !v)}
              pill={
                <StatusPill
                  on={!summarizerIssue && summarizerConnected}
                  label={summarizerConnected ? "Configured" : "Missing"}
                  tone={
                    summarizerIssue
                      ? "warning"
                      : summarizerConnected
                        ? "success"
                        : "warning"
                  }
                />
              }
            >
              <div
                style={{
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-3)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Summarizer
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <OptionCard
                  selected={summarizerProvider === "auto"}
                  onClick={() => set("summarizer_provider", "auto")}
                  title="Auto"
                  desc="Use OpenAI if available, otherwise Anthropic. If neither key is set, digest run fails."
                />
                <OptionCard
                  selected={summarizerProvider === "openai"}
                  onClick={() => set("summarizer_provider", "openai")}
                  title="OpenAI"
                  desc="Use OpenAI for summaries (requires OPENAI_API_KEY)."
                />
                <OptionCard
                  selected={summarizerProvider === "anthropic"}
                  onClick={() => set("summarizer_provider", "anthropic")}
                  title="Anthropic"
                  desc="Use Anthropic for summaries (requires ANTHROPIC_API_KEY)."
                />
              </div>

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {(summarizerProvider === "openai" ||
                  summarizerProvider === "auto") && (
                  <SecretField
                    label="OpenAI API Key"
                    name="openai_api_key"
                    value={fields.openai_api_key ?? ""}
                    isSaved={c.openai_api_key}
                    onChange={(v) => set("openai_api_key", v)}
                    invalid={
                      showValidationErrors && summarizerProvider === "openai"
                    }
                    locked={locked}
                    onUnlockRequest={onUnlockRequest}
                  />
                )}
                {(summarizerProvider === "anthropic" ||
                  summarizerProvider === "auto") && (
                  <SecretField
                    label="Anthropic API Key"
                    name="anthropic_api_key"
                    value={fields.anthropic_api_key ?? ""}
                    isSaved={c.anthropic_api_key}
                    onChange={(v) => set("anthropic_api_key", v)}
                    invalid={
                      showValidationErrors && summarizerProvider === "anthropic"
                    }
                    locked={locked}
                    onUnlockRequest={onUnlockRequest}
                  />
                )}
              </div>

              {openaiMissing && (
                <div style={{ marginTop: 10 }}>
                  <SetupHint
                    title="OpenAI key required"
                    description="Create an API key in your OpenAI account and paste it into OpenAI API Key above."
                    linkHref="https://platform.openai.com/api-keys"
                    linkLabel="Get API key now"
                    onLinkClick={() => setShowOpenAiSteps(true)}
                  />
                </div>
              )}

              {anthropicMissing && (
                <div style={{ marginTop: 10 }}>
                  <SetupHint
                    title="Anthropic key required"
                    description="Create an API key in Anthropic Console and paste it into Anthropic API Key above."
                    linkHref="https://console.anthropic.com/settings/keys"
                    linkLabel="Get API key now"
                    onLinkClick={() => setShowAnthropicSteps(true)}
                  />
                </div>
              )}

              {autoMissingBoth && (
                <div style={{ marginTop: 10 }}>
                  <SetupHint
                    title="Auto mode needs at least one key"
                    description="Add either an OpenAI or Anthropic key. Without keys, digest run fails with unable to summarize."
                    linkHref="https://platform.openai.com/api-keys"
                    linkLabel="Open OpenAI Keys (or use Anthropic)"
                  />
                </div>
              )}

              {openaiMissing && showOpenAiSteps && (
                <div className="card card-soft" style={{ marginTop: 10 }}>
                  <p
                    style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700 }}
                  >
                    OpenAI setup steps
                  </p>
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      display: "grid",
                      gap: 6,
                      color: "var(--text-2)",
                      fontSize: 12,
                    }}
                  >
                    <li>Open the OpenAI API Keys page.</li>
                    <li>Sign in to your OpenAI account.</li>
                    <li>Click Create new secret key.</li>
                    <li>Copy the key immediately.</li>
                    <li>Paste it into OpenAI API Key above and click Save.</li>
                  </ol>
                </div>
              )}

              {anthropicMissing && showAnthropicSteps && (
                <div className="card card-soft" style={{ marginTop: 10 }}>
                  <p
                    style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700 }}
                  >
                    Anthropic setup steps
                  </p>
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      display: "grid",
                      gap: 6,
                      color: "var(--text-2)",
                      fontSize: 12,
                    }}
                  >
                    <li>Open Anthropic Console keys page.</li>
                    <li>Sign in to your Anthropic account.</li>
                    <li>Create a new API key.</li>
                    <li>Copy the key value.</li>
                    <li>
                      Paste it into Anthropic API Key above and click Save.
                    </li>
                  </ol>
                </div>
              )}
            </SubSection>

          </>
        )}

        {ingestionMode === "external_worker" && (
          <>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "var(--text-2)",
                lineHeight: 1.6,
              }}
            >
              OpenClaw will push digests via the worker endpoint. Configure the
              allowed IP here to open the gate. Read Documentation on README to
              know how to set it up.
            </p>
            <div
              style={{
                marginBottom: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-3)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                OpenClaw Connection
              </p>
              <StatusPill
                on={workerConnected}
                label={
                  workerConnected
                    ? "Connected"
                    : workerWaiting
                      ? "Waiting"
                      : "Closed"
                }
                tone={
                  workerConnected
                    ? "success"
                    : workerWaiting
                      ? "info"
                      : "warning"
                }
              />
            </div>
            {!workerConfigured && (
              <SetupHint
                title="OpenClaw endpoint is closed"
                description="Set your OpenClaw worker's outbound public IP below. Leave blank only if you want the endpoint disabled."
                linkHref="https://ifconfig.me"
                linkLabel="Check worker public IP"
              />
            )}
            <label className="settings-label">
              OpenClaw IP Address
              <input
                className="field"
                value={workerAllowedIp}
                onChange={(e) => set("worker_allowed_ip", e.target.value)}
                placeholder="e.g. 203.0.113.42"
              />
            </label>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 12,
                color: "var(--text-2)",
                lineHeight: 1.5,
              }}
            >
              The status will switch to Connected once it receives its first
              digest. Make sure to run your first digest to confirm the
              connection.
            </p>
          </>
        )}

        {/* Save row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            paddingTop: 4,
          }}
        >
          <button
            className="btn btn-primary"
            onClick={saveSource}
            disabled={sourceSaving}
          >
            {sourceSaving ? "Saving…" : "Save"}
          </button>
          {sourceMsg && (
            <span
              style={{
                fontSize: 13,
                color:
                  sourceMsg === "Saved." ? "var(--success)" : "var(--danger)",
              }}
            >
              {sourceMsg}
            </span>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Database"
        subtitle={
          !databaseConnected
            ? "Not connected"
            : databaseIssue
              ? `Connected with issue${databaseLabel ? ` · ${databaseLabel}` : ""}`
              : `${status.database_host || "connected"}${databaseLabel ? ` · ${databaseLabel}` : ""}`
        }
        pill={
          <StatusPill
            on={databaseConnected}
            label={databaseLabelText}
            tone={databaseTone}
          />
        }
        open={databaseOpen}
        onToggle={() => setDatabaseOpen((v) => !v)}
      >
        {!databaseConnected && (
          <SetupHint
            title="Database connection needed"
            description="Choose provider, fill connection fields, then Save. In local development this also updates .env.local."
            linkHref="https://neon.tech/docs/get-started-with-neon/signing-up"
            linkLabel="Create free Neon Postgres"
          />
        )}

        <div>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-3)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Provider
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <OptionCard
              selected={databaseProvider === "neon"}
              onClick={() => set("database_provider", "neon")}
              title="Neon"
              desc="Managed serverless Postgres."
            />
            <OptionCard
              selected={databaseProvider === "supabase"}
              onClick={() => set("database_provider", "supabase")}
              title="Supabase"
              desc="Postgres with dashboard tooling."
            />
            <OptionCard
              selected={databaseProvider === "other"}
              onClick={() => set("database_provider", "other")}
              title="Other"
              desc="Any Postgres-compatible provider."
            />
          </div>
        </div>

        {databaseProvider === "neon" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SecretField
              label="Neon Host"
              name="neon_host"
              value={fields.neon_host ?? ""}
              isSaved={databaseConnected}
              onChange={(v) => set("neon_host", v)}
              locked={locked}
              onUnlockRequest={onUnlockRequest}
            />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label className="settings-label" style={{ flex: "1 1 180px" }}>
                Database
                <input
                  className="field"
                  value={fields.neon_database ?? (databaseConnected && !locked ? "" : "neondb")}
                  onChange={(e) => set("neon_database", e.target.value)}
                  placeholder="neondb"
                />
              </label>
              <label className="settings-label" style={{ flex: "1 1 180px" }}>
                User
                <input
                  className="field"
                  value={fields.neon_user ?? (databaseConnected && !locked ? "" : "neondb_owner")}
                  onChange={(e) => set("neon_user", e.target.value)}
                  placeholder="neondb_owner"
                />
              </label>
            </div>
            <SecretField
              label="Neon Password"
              name="neon_password"
              value={fields.neon_password ?? ""}
              isSaved={databaseConnected}
              onChange={(v) => set("neon_password", v)}
              locked={locked}
              onUnlockRequest={onUnlockRequest}
            />
            <SecretField
              label="Neon Connection String (optional override)"
              name="database_url"
              value={fields.database_url ?? ""}
              isSaved={databaseConnected}
              onChange={(v) => set("database_url", v)}
              locked={locked}
              onUnlockRequest={onUnlockRequest}
            />
          </div>
        )}

        {databaseProvider === "supabase" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label className="settings-label">
              Supabase Host
              <input
                className="field"
                value={fields.supabase_host ?? ""}
                onChange={(e) => set("supabase_host", e.target.value)}
                placeholder="db.<project-ref>.supabase.co"
              />
            </label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label className="settings-label" style={{ flex: "1 1 140px" }}>
                Port
                <input
                  className="field"
                  value={fields.supabase_port ?? "5432"}
                  onChange={(e) => set("supabase_port", e.target.value)}
                  placeholder="5432"
                />
              </label>
              <label className="settings-label" style={{ flex: "1 1 180px" }}>
                Database
                <input
                  className="field"
                  value={fields.supabase_database ?? "postgres"}
                  onChange={(e) => set("supabase_database", e.target.value)}
                  placeholder="postgres"
                />
              </label>
              <label className="settings-label" style={{ flex: "1 1 180px" }}>
                User
                <input
                  className="field"
                  value={fields.supabase_user ?? "postgres"}
                  onChange={(e) => set("supabase_user", e.target.value)}
                  placeholder="postgres"
                />
              </label>
            </div>
            <SecretField
              label="Supabase Password"
              name="supabase_password"
              value={fields.supabase_password ?? ""}
              isSaved={databaseConnected}
              onChange={(v) => set("supabase_password", v)}
              locked={locked}
              onUnlockRequest={onUnlockRequest}
            />
            <SecretField
              label="Supabase Connection String (optional override)"
              name="database_url"
              value={fields.database_url ?? ""}
              isSaved={databaseConnected}
              onChange={(v) => set("database_url", v)}
              locked={locked}
              onUnlockRequest={onUnlockRequest}
            />
          </div>
        )}

        {databaseProvider === "other" && (
          <SecretField
            label="Database URL"
            name="database_url"
            value={fields.database_url ?? ""}
            isSaved={databaseConnected}
            onChange={(v) => set("database_url", v)}
            locked={locked}
            onUnlockRequest={onUnlockRequest}
          />
        )}

        <label className="settings-label">
          Database label
          <input
            className="field"
            value={databaseLabel}
            onChange={(e) => set("database_label", e.target.value)}
            placeholder="e.g. Production DB"
          />
        </label>

        {databaseProvider === "neon" && !databaseConnected && (
          <SetupHint
            title="Neon quick setup"
            description="Create project and role password in Neon, then fill host/user/database/password above and click Save."
            linkHref="https://neon.tech/docs/connect/connect-from-any-app"
            linkLabel="Neon connection guide"
          />
        )}

        {databaseProvider === "supabase" && !databaseConnected && (
          <SetupHint
            title="Supabase quick setup"
            description="Create project, copy connection details from Database settings, fill fields above, then click Save."
            linkHref="https://supabase.com/docs/guides/database/connecting-to-postgres"
            linkLabel="Supabase connection guide"
          />
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            paddingTop: 4,
          }}
        >
          <button
            className="btn btn-primary"
            onClick={saveDatabase}
            disabled={databaseSaving}
          >
            {databaseSaving ? "Saving…" : "Save"}
          </button>
          {databaseMsg && (
            <span
              style={{
                fontSize: 13,
                color:
                  databaseMsg === "Saved." ? "var(--success)" : "var(--danger)",
              }}
            >
              {databaseMsg}
            </span>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
