import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __twitterDigestPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __twitterDigestPoolUrl: string | undefined;
  // eslint-disable-next-line no-var
  var __twitterDigestDatabaseUrlOverride: string | undefined;
}

function createPool(databaseUrl: string) {
  const config: { connectionString: string; max: number; ssl?: boolean | { rejectUnauthorized: boolean } } = {
    connectionString: databaseUrl,
    max: 5,
  };

  // Let connection-string SSL params control TLS by default.
  // Only force-disable SSL for explicit local/dev cases.
  if (process.env.DATABASE_SSL === "false") {
    config.ssl = false;
  }

  return new Pool(config);
}

export function getResolvedDatabaseUrl(): string {
  const override = global.__twitterDigestDatabaseUrlOverride?.trim();
  if (override) return override;
  return process.env.DATABASE_URL?.trim() || "";
}

export function setDatabaseUrlOverride(databaseUrl: string | null): void {
  const next = (databaseUrl || "").trim();
  global.__twitterDigestDatabaseUrlOverride = next || undefined;
}

export async function resetPool(): Promise<void> {
  const existing = global.__twitterDigestPool;
  global.__twitterDigestPool = undefined;
  global.__twitterDigestPoolUrl = undefined;
  if (existing) {
    await existing.end().catch(() => {});
  }
}

export function hasDatabaseConfig(): boolean {
  return Boolean(getResolvedDatabaseUrl());
}

export function getPool(): Pool {
  const databaseUrl = getResolvedDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  if (!global.__twitterDigestPool || global.__twitterDigestPoolUrl !== databaseUrl) {
    const previousPool = global.__twitterDigestPool;
    global.__twitterDigestPool = createPool(databaseUrl);
    global.__twitterDigestPoolUrl = databaseUrl;
    if (previousPool) {
      void previousPool.end().catch(() => {});
    }
  }

  return global.__twitterDigestPool;
}
