import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSettings } from "@/lib/backend/db/repository";

const CREDENTIAL_KEYS = [
  "twitter_bearer_token",
  "twitter_api_key",
  "twitter_api_secret",
  "twitter_access_token",
  "twitter_access_token_secret",
  "openai_api_key",
  "anthropic_api_key",
  "database_url",
] as const;

function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return value.slice(0, 4) + "••••••••" + value.slice(-4);
}

function timingSafeMatch(expected: string, actual: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password : "";
  const expectedPassword = process.env.ADMIN_PASSWORD?.trim() ?? "";

  if (!expectedPassword || !password || !timingSafeMatch(expectedPassword, password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const settings = await getSettings([...CREDENTIAL_KEYS]);
  const values: Record<string, string> = {};
  for (const key of CREDENTIAL_KEYS) {
    const raw = key === "database_url"
      ? (settings[key] ?? process.env.DATABASE_URL ?? "")
      : (settings[key] ?? "");
    values[key] = maskSecret(raw);
  }

  return NextResponse.json(values);
}
