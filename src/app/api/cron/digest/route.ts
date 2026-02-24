import { NextRequest, NextResponse } from "next/server";
import { checkCronAuth } from "@/lib/backend/auth";
import { runTwitterDigestNow } from "@/lib/backend/ingest/runTwitterDigest";

export async function POST(req: NextRequest) {
  const auth = await checkCronAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await runTwitterDigestNow();
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Digest run failed" }, { status: 500 });
  }
}
