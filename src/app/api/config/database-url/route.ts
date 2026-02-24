import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { promises as fs } from "fs";
import path from "path";
import { auth } from "@/auth";
import { getResolvedDatabaseUrl, resetPool, setDatabaseUrlOverride } from "@/lib/backend/db/client";
import { ensureSchema, resetSchemaCache } from "@/lib/backend/db/schema";
import { GET as getStatus } from "@/app/api/config/status/route";

function isPostgresUrl(value: string): boolean {
  return /^postgres(?:ql)?:\/\//i.test(value);
}

function quoteEnvValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

async function upsertEnvValue(key: string, rawValue: string): Promise<void> {
  const envPath = path.join(process.cwd(), ".env.local");
  const safeValue = quoteEnvValue(rawValue);
  let content = "";
  try {
    content = await fs.readFile(envPath, "utf8");
  } catch (error: any) {
    if (error?.code !== "ENOENT") throw error;
  }

  const lines = content ? content.split(/\r?\n/) : [];
  let replaced = false;
  const nextLines = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      replaced = true;
      return `${key}=${safeValue}`;
    }
    return line;
  });

  if (!replaced) {
    nextLines.push(`${key}=${safeValue}`);
  }

  const finalContent = `${nextLines.filter((line, idx, arr) => !(idx === arr.length - 1 && line === "")).join("\n")}\n`;
  await fs.writeFile(envPath, finalContent, "utf8");
}

async function verifyDatabaseConnection(databaseUrl: string): Promise<void> {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    ...(process.env.DATABASE_SSL === "false" ? { ssl: false } : {}),
  });
  try {
    await pool.query("SELECT 1");
  } finally {
    await pool.end().catch(() => {});
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const previousDatabaseUrl = getResolvedDatabaseUrl();
  try {
    const body = (await req.json()) as { database_url?: unknown };
    const databaseUrl = typeof body.database_url === "string" ? body.database_url.trim() : "";
    if (!databaseUrl) {
      return NextResponse.json({ error: "database_url is required." }, { status: 400 });
    }
    if (!isPostgresUrl(databaseUrl)) {
      return NextResponse.json({ error: "database_url must be a Postgres URL." }, { status: 400 });
    }

    await verifyDatabaseConnection(databaseUrl);

    // Apply immediately for current runtime, and persist for dev restarts.
    setDatabaseUrlOverride(databaseUrl);
    await upsertEnvValue("DATABASE_URL", databaseUrl);
    if (process.env.DATABASE_SSL) {
      await upsertEnvValue("DATABASE_SSL", process.env.DATABASE_SSL);
    }

    await resetPool();
    resetSchemaCache();
    await ensureSchema();

    return getStatus();
  } catch (error: any) {
    // Restore previous runtime state if apply failed.
    setDatabaseUrlOverride(previousDatabaseUrl || null);
    return NextResponse.json(
      { error: error?.message || "Failed to configure database URL." },
      { status: 500 },
    );
  }
}
