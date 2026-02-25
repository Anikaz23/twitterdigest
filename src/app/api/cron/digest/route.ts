import { NextRequest, NextResponse } from "next/server";
import { checkCronAuth } from "@/lib/backend/auth";
import { runTwitterDigestNow } from "@/lib/backend/ingest/runTwitterDigest";
import { insertCronLog } from "@/lib/backend/db/repository";

export async function POST(req: NextRequest) {
  const auth = await checkCronAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await runTwitterDigestNow();

    await insertCronLog({
      status: result.skipped
        ? result.reason === "no_new_data" ? "no_new_data" : "skipped"
        : "digest_created",
      digestId: "digestId" in result ? result.digestId : null,
      message: result.skipped ? (result.reason ?? null) : null,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    await insertCronLog({
      status: "error",
      message: error?.message ?? "unknown error",
    }).catch(() => {});
    return NextResponse.json({ error: error?.message || "Digest run failed" }, { status: 500 });
  }
}
