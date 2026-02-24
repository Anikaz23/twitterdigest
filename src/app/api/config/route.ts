import { NextRequest, NextResponse } from "next/server";
import { deleteSetting, setSetting } from "@/lib/backend/db/repository";
import { GET as getStatus } from "@/app/api/config/status/route";
import { auth } from "@/auth";

const CREDENTIAL_KEYS = new Set([
  "twitter_bearer_token",
  "twitter_api_key",
  "twitter_api_secret",
  "twitter_access_token",
  "twitter_access_token_secret",
  "openai_api_key",
  "anthropic_api_key",
  "cron_secret",
]);

const PLAIN_KEYS = new Set([
  "ingestion_mode",
  "twitter_mode",
  "twitter_pull_mode",
  "summarizer_provider",
  "cron_schedule",
  "ui_theme",
  "database_provider",
  "database_label",
  "twitter_user_id",
  "twitter_username",
  "twitter_query",
  "twitter_max_results",
  "worker_allowed_ip",
]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const keys = Object.keys(body);

    for (const key of keys) {
      const value = body[key];
      if (typeof value !== "string") continue;

      if (!CREDENTIAL_KEYS.has(key) && !PLAIN_KEYS.has(key)) continue;
      if (CREDENTIAL_KEYS.has(key) && value.trim() === "") {
        await deleteSetting(key);
        continue;
      }

      await setSetting(key, value.trim());
    }

    return getStatus();
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to save config" }, { status: 500 });
  }
}
