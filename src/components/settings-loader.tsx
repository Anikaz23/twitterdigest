"use client";

import { useEffect, useState } from "react";
import SettingsForm from "@/app/settings/settings-form";
import type { ConfigStatus } from "@/lib/types";

const CLIENT_DEFAULT_CONFIG: ConfigStatus = {
  admin_protected: false,
  ingestion_mode: "twitter_api",
  twitter_mode: "bearer_token",
  twitter_pull_mode: "user_timeline",
  summarizer_provider: "auto",
  cron_schedule: "0 */3 * * *",
  ui_theme: "x",
  database_provider: "auto",
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
const ADMIN_KEY = "digest:admin-secret";

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
  const [adminSecret, setAdminSecret] = useState("");
  const [adminSecretVisible, setAdminSecretVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADMIN_KEY);
      if (stored) setAdminSecret(stored);
    } catch {}

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

  function handleAdminSecretChange(v: string) {
    setAdminSecret(v);
    try { localStorage.setItem(ADMIN_KEY, v); } catch {}
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

  const showAdminInput = config?.admin_protected ?? false;

  return (
    <div className="page-stack">
      <h1 className="page-title">Settings</h1>

      {showAdminInput && (
        <div className="card card-soft" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="var(--text-3)" aria-hidden="true">
              <path d="M8 1a4 4 0 0 1 4 4v1h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h1V5a4 4 0 0 1 4-4zm0 1.5A2.5 2.5 0 0 0 5.5 5v1h5V5A2.5 2.5 0 0 0 8 2.5z"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Admin secret</span>
          </div>
          <div style={{ position: "relative" }}>
            <input
              className="field"
              type={adminSecretVisible ? "text" : "password"}
              placeholder="Paste your ADMIN_SECRET value"
              value={adminSecret}
              onChange={(e) => handleAdminSecretChange(e.target.value)}
              style={{ paddingRight: 48 }}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setAdminSecretVisible((v) => !v)}
              style={{
                position: "absolute", right: 10, top: "50%",
                transform: "translateY(-50%)", background: "none",
                border: "none", color: "var(--text-3)", cursor: "pointer",
                fontSize: 11, padding: 0,
              }}
            >
              {adminSecretVisible ? "hide" : "show"}
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: "var(--text-3)" }}>
            Stored locally in your browser. Required to save any settings.
          </p>
        </div>
      )}

      {note && (
        <div className="card card-soft">
          <p className="muted" style={{ margin: 0 }}>{note}</p>
        </div>
      )}
      {config && (
        <SettingsForm
          initial={config}
          adminSecret={showAdminInput ? adminSecret : undefined}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
