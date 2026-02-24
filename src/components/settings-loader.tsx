"use client";

import { useEffect, useRef, useState } from "react";
import SettingsForm from "@/app/(protected)/settings/settings-form";
import type { ConfigStatus } from "@/lib/types";

const CLIENT_DEFAULT_CONFIG: ConfigStatus = {
  ingestion_mode: "twitter_api",
  twitter_mode: "bearer_token",
  twitter_pull_mode: "user_timeline",
  summarizer_provider: "auto",
  cron_schedule: "0 */3 * * *",
  ui_theme: "x",
  database_provider: "other",
  database_label: "",
  database_connected: false,
  database_host: "",
  twitter_user_id: "",
  twitter_username: "",
  twitter_query: "",
  twitter_max_results: 100,
  worker_allowed_ip: "",
  worker_first_digest_received: false,
  configured: {
    twitter_bearer_token: false,
    twitter_api_key: false,
    twitter_api_secret: false,
    twitter_access_token: false,
    twitter_access_token_secret: false,
    openai_api_key: false,
    anthropic_api_key: false,
    cron_secret: false,
  },
};

const CACHE_KEY = "digest:settings";

function readCache(): ConfigStatus | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as ConfigStatus) : null;
  } catch { return null; }
}

function writeCache(s: ConfigStatus) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch {}
}

export default function SettingsLoader() {
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [note, setNote] = useState("");

  // Credential unlock state
  const [revealedValues, setRevealedValues] = useState<Record<string, string> | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlockLoading, setUnlockLoading] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cached = readCache();
    if (cached) setConfig(cached);

    fetch("/api/config/status")
      .then(async (r) => {
        const data: ConfigStatus = await r.json();
        setConfig(data);
        writeCache(data);
        if (!data.database_connected) {
          setNote("Database not connected. You can review fields, but saving requires a database connection.");
        } else {
          setNote("");
        }
      })
      .catch(() => {
        if (!cached) {
          setConfig(CLIENT_DEFAULT_CONFIG);
          setNote("Database not connected. You can review fields, but saving requires a database connection.");
        }
      });
  }, []);

  // Focus password input when modal opens
  useEffect(() => {
    if (showModal) {
      setTimeout(() => passwordInputRef.current?.focus(), 50);
    }
  }, [showModal]);

  // Close modal on Escape
  useEffect(() => {
    if (!showModal) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal]);

  function openModal() {
    setUnlockError("");
    setUnlockPassword("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setUnlockPassword("");
    setUnlockError("");
  }

  function handleStatusChange(s: ConfigStatus) {
    setConfig(s);
    writeCache(s);
    if (!s.database_connected) {
      setNote("Database not connected. You can review fields, but saving requires a database connection.");
    } else {
      setNote("");
    }
  }

  async function handleUnlock(e: { preventDefault: () => void }) {
    e.preventDefault();
    setUnlockError("");
    setUnlockLoading(true);
    try {
      const res = await fetch("/api/config/reveal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: unlockPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setUnlockError(data.error || "Incorrect password.");
        return;
      }
      const values = await res.json() as Record<string, string>;
      setRevealedValues(values);
      closeModal();
    } finally {
      setUnlockLoading(false);
    }
  }

  return (
    <div className="page-stack">
      {note && (
        <div className="card card-soft">
          <p className="muted" style={{ margin: 0 }}>{note}</p>
        </div>
      )}

      {config && (
        <SettingsForm
          initial={config}
          onStatusChange={handleStatusChange}
          revealedValues={revealedValues}
          onUnlockRequest={openModal}
        />
      )}

      {/* Unlock modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Unlock credentials"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>Unlock credentials</p>
              <p className="muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
                Enter your password to reveal and edit saved values.
              </p>
            </div>

            <form onSubmit={handleUnlock} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                ref={passwordInputRef}
                className="field"
                type="password"
                placeholder="Password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                disabled={unlockLoading}
                autoComplete="current-password"
              />
              {unlockError && (
                <p style={{ margin: 0, fontSize: 12, color: "var(--error, #e53e3e)" }}>{unlockError}</p>
              )}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn"
                  onClick={closeModal}
                  disabled={unlockLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={unlockLoading || !unlockPassword}
                >
                  {unlockLoading ? "Unlocking…" : "Unlock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
