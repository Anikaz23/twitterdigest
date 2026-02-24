"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        username: "admin",
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Incorrect password.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        background: "var(--bg)",
      }}
    >
      <div
        className="card"
        style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 24 }}
      >
        <div>
          <p className="brand-title" style={{ margin: 0, marginBottom: 4, fontSize: 22 }}>
            Digest
          </p>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Enter your password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            className="field"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          {error && (
            <p style={{ margin: 0, fontSize: 12, color: "var(--error, #e53e3e)" }}>{error}</p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !password}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
