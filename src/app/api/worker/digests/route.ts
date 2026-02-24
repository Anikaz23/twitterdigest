import { NextRequest, NextResponse } from "next/server";
import { checkWorkerAuth } from "@/lib/backend/auth";
import { setSetting } from "@/lib/backend/db/repository";
import { analyzeTweetBatch, persistDigestFromBatch } from "@/lib/backend/ingest/pipeline";
import type { DigestStatus } from "@/lib/types";
import type { TwitterTweet } from "@/lib/backend/twitter/client";

type WorkerDigestPayload = {
  source?: string;
  title?: string;
  summary?: string;
  topics?: string[] | null;
  status?: DigestStatus;
  idempotency_key?: string;
  worker_run_id?: string;
  metadata?: unknown;
  raw_tweets?: unknown[] | null;
};

function normalizeTweets(input: unknown[] | null | undefined): TwitterTweet[] {
  if (!Array.isArray(input)) return [];
  const unique = new Map<string, TwitterTweet>();

  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const text = typeof row.text === "string" ? row.text.trim() : "";
    if (!id || !text) continue;

    const authorHandle = typeof row.authorHandle === "string" ? row.authorHandle.trim() : "@unknown";
    const timestamp = typeof row.timestamp === "string" ? row.timestamp : "";
    const url = typeof row.url === "string" ? row.url : "";

    unique.set(id, {
      id,
      text,
      authorHandle: authorHandle || "@unknown",
      timestamp,
      url,
    });
  }

  return Array.from(unique.values());
}

export async function POST(req: NextRequest) {
  const auth = await checkWorkerAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await req.json()) as WorkerDigestPayload;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const summary = typeof body.summary === "string" ? body.summary.trim() : "";
    if (!summary) {
      return NextResponse.json({ error: "summary is required" }, { status: 400 });
    }

    const status = body.status ?? "completed";
    if (!["running", "completed", "failed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const idempotencyKey =
      (typeof body.idempotency_key === "string" ? body.idempotency_key.trim() : "") ||
      (req.headers.get("idempotency-key") || "").trim() ||
      null;

    const tweets = normalizeTweets(body.raw_tweets);
    const batch = await analyzeTweetBatch(tweets);
    const saved = await persistDigestFromBatch({
      batch,
      summary,
      topics: Array.isArray(body.topics) ? body.topics.map((topic) => String(topic)) : null,
      status,
      source: typeof body.source === "string" && body.source.trim() ? body.source.trim() : "external_worker",
      idempotencyKey,
      workerRunId:
        typeof body.worker_run_id === "string" && body.worker_run_id.trim()
          ? body.worker_run_id.trim()
          : null,
      metadata:
        body.metadata && typeof body.metadata === "object"
          ? { ...(body.metadata as Record<string, unknown>), ...(title ? { title } : {}) }
          : title
            ? { title }
          : null,
    });

    try {
      await setSetting("worker_first_digest_received", "true");
    } catch (err) {
      console.warn("Failed to set worker_first_digest_received:", err);
    }

    return NextResponse.json(
      {
        success: true,
        duplicate: saved.duplicate,
        digestId: saved.digestId,
        counts: saved.counts,
      },
      { status: saved.duplicate ? 200 : 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to ingest worker digest" }, { status: 500 });
  }
}
