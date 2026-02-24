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
    // database_url lives in env (written by database-url route), not the DB settings table
    if (key === "database_url") {
      values[key] = settings[key] ?? process.env.DATABASE_URL ?? "";
    } else {
      values[key] = settings[key] ?? "";
    }
  }

  return NextResponse.json(values);
}
