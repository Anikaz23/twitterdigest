import { NextRequest, NextResponse } from "next/server";
import { checkWorkerAuth } from "@/lib/backend/auth";

export async function GET(req: NextRequest) {
  const auth = await checkWorkerAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
