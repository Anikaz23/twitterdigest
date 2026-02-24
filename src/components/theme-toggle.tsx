"use client";

import { useEffect, useState } from "react";
import type { UiTheme } from "@/lib/types";

type Theme = UiTheme;

function BirdIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M23.95 4.57a10.02 10.02 0 0 1-2.83.78 4.94 4.94 0 0 0 2.17-2.72 9.87 9.87 0 0 1-3.13 1.2 4.92 4.92 0 0 0-8.39 4.49A13.94 13.94 0 0 1 1.67 3.15a4.9 4.9 0 0 0 1.52 6.57 4.9 4.9 0 0 1-2.23-.62v.06a4.92 4.92 0 0 0 3.95 4.83 4.93 4.93 0 0 1-2.22.08 4.94 4.94 0 0 0 4.6 3.42A9.88 9.88 0 0 1 .96 19.53a13.9 13.9 0 0 0 7.56 2.21c9.06 0 14.01-7.5 14.01-14.01 0-.21 0-.42-.02-.63a9.96 9.96 0 0 0 2.44-2.53z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2h3.68l-8.04 9.19L24 22h-7.41l-5.8-7.53L4.2 22H.5l8.6-9.83L0 2h7.6l5.24 6.87L18.9 2Zm-1.3 17.77h2.04L6.49 4.11H4.3L17.6 19.77Z" />
    </svg>
  );
}

function parseTheme(value: string | null): Theme {
  return value === "x" ? "x" : "twitter";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("twitter");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const htmlTheme = parseTheme(document.documentElement.getAttribute("data-theme"));
    const rawStoredTheme = localStorage.getItem("ui-theme");
    const storedTheme = parseTheme(rawStoredTheme);
    const initial = rawStoredTheme ? storedTheme : htmlTheme;
    setTheme(initial);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ui-theme", theme);
  }, [theme, ready]);

  function toggleTheme() {
    const next: Theme = theme === "x" ? "twitter" : "x";
    setTheme(next);
  }

  const isX = theme === "x";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isX ? "Switch to Twitter theme" : "Switch to X theme"}
      title={isX ? "Switch to Twitter" : "Switch to X"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        flexShrink: 0,
        background: isX ? "#1d9bf0" : "#000000",
        color: "#ffffff",
        boxShadow: isX
          ? "0 2px 8px rgba(29,155,240,0.45)"
          : "0 2px 8px rgba(0,0,0,0.3)",
        transition: "transform 200ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 200ms",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.12)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
    >
      {isX ? <BirdIcon /> : <XIcon />}
    </button>
  );
}
